import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList, Image, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../styles/theme';
import apiService from '../services/apiService';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#fff"
  }
};

// Color palette for product types - matches app's maroon theme
const productTypeColors = {
  'Meal': '#D22B2B',        // Main maroon red
  'Drink': '#FF6B6B',    // Coral red
  'Snacks': '#FFA500',      // Orange
  'Sides': '#FFD700',     // Gold
  'Merchandise': '#8B4513', // Saddle brown
  'Other': '#696969'        // Dim gray
};

const ProductCard = ({ product }) => (
  <View style={styles.productCard}>
    <Image source={{ uri: product.image_url || 'https://via.placeholder.com/150' }} style={styles.productImage} />
    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
    <View style={styles.soldContainer}>
      <Icon name="cart" size={12} color="#888" />
      <Text style={styles.soldText}>{product.total_sold} sold</Text>
    </View>
    <Text style={styles.productPrice}>₱{parseFloat(product.price).toFixed(2)}</Text>
  </View>
);

const VendorHomePage = ({ navigation }) => { // <-- Add navigation prop
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    monthlySales: [],
    salesByType: {}, // Sales grouped by product type
    daysInMonth: 30
  });
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (storeId) {
      loadTransactions();
    }
  }, [activeMonth, storeId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Get vendor from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        Alert.alert('Error', 'User not found. Please login again.');
        navigation.replace('SignIn');
        return;
      }

      const userData = JSON.parse(userDataStr);
      const vendorStoreId = userData.store_id;

      if (!vendorStoreId) {
        Alert.alert('Error', 'Store not assigned to this vendor.');
        return;
      }

      setStoreId(vendorStoreId);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data.');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!storeId) return;

    try {
      setLoading(true);

      const userData = await AsyncStorage.getItem('@app_user');
      const parsedUser = JSON.parse(userData);

      if (!parsedUser || parsedUser.role !== 'vendor' || !parsedUser.user_id) {
        Alert.alert('Error', 'Vendor or User ID not found. Please relog.');
        setLoading(false);
        return;
      }

      const userId = parsedUser.user_id;
      let response = null;
      let txns = [];

      // 1) Primary: try user-specific endpoint (common signature)
      try {
        response = await apiService.getUserTransactions(userId, 'vendor');
        if (response && Array.isArray(response.transactions) && response.transactions.length > 0) {
          txns = response.transactions;
        }
      } catch (err) {
        console.log('getUserTransactions(userId, "vendor") failed:', err?.message || err);
      }

      // 2) Secondary: try user-specific without role (some apiService variants)
      if (txns.length === 0) {
        try {
          response = await apiService.getUserTransactions(userId);
          if (response && Array.isArray(response.transactions) && response.transactions.length > 0) {
            txns = response.transactions;
          }
        } catch (err) {
          console.log('getUserTransactions(userId) failed:', err?.message || err);
        }
      }

      // 3) Fallback: fetch store transactions and filter by Vendor_ID === userId
      if (txns.length === 0 && parsedUser.store_id) {
        try {
          const storeResp = await apiService.getStoreTransactions(parsedUser.store_id);
          if (storeResp && Array.isArray(storeResp.transactions)) {
            txns = storeResp.transactions.filter(t => String(t.Vendor_ID) === String(userId));
          }
        } catch (err) {
          console.log('getStoreTransactions fallback failed:', err?.message || err);
        }
      }

      // Filter transactions by selected month and year
      const filteredTxns = txns.filter(txn => {
        const txnDate = new Date(txn.transaction_date);
        return txnDate.getMonth() === activeMonth && txnDate.getFullYear() === currentYear;
      });

      setTransactions(filteredTxns);
      computeAnalytics(filteredTxns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const computeAnalytics = (txns) => {
    const today = new Date();
    const todayStr = today.toDateString();
    let todayRevenue = 0;
    let todayOrders = new Set();

    // Determine days in month
    const daysInMonth = new Date(currentYear, activeMonth + 1, 0).getDate();
    const monthlySales = new Array(daysInMonth).fill(0);
    const salesByType = {};

    // Group by product type and day
    txns.forEach(txn => {
      const txnDate = new Date(txn.transaction_date);
      const txnDateStr = txnDate.toDateString();
      const day = txnDate.getDate() - 1; // 0-based
      const productType = txn.products?.category || txn.category || 'Other';
      const revenue = parseFloat(txn.price || 0) * parseFloat(txn.quantity || 1);

      // Today's metrics
      if (txnDateStr === todayStr) {
        todayRevenue += revenue;
        todayOrders.add(txn.reference_number);
      }

      // Monthly sales
      if (day >= 0 && day < daysInMonth) {
        monthlySales[day] += revenue;
      }

      // Sales by type
      if (!salesByType[productType]) {
        salesByType[productType] = new Array(daysInMonth).fill(0);
      }
      if (day >= 0 && day < daysInMonth) {
        salesByType[productType][day] += revenue;
      }
    });

    const todayOrdersCount = todayOrders.size;

    // Top products
    const productRevenue = {};
    txns.forEach(txn => {
      const productName = txn.products?.product_name || txn.product_name || 'Unknown Product';
      const revenue = parseFloat(txn.price || 0) * parseFloat(txn.quantity || 1);
      productRevenue[productName] = (productRevenue[productName] || 0) + revenue;
    });

    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue], index) => ({
        id: index + 1,
        name,
        price: txns.find(t => (t.products?.product_name || t.product_name) === name)?.price || 0,
        total_sold: Math.floor(revenue / (txns.find(t => (t.products?.product_name || t.product_name) === name)?.price || 1)), // Approximate
        image_url: txns.find(t => (t.products?.product_name || t.product_name) === name)?.products?.image_url || null
      }));

    setSalesSummary({
      todayRevenue,
      todayOrders: todayOrdersCount,
      monthlySales,
      salesByType,
      daysInMonth
    });
    setTopProducts(topProducts);
  };

  // Prepare chart data - group by weeks
  const daysInMonth = salesSummary.daysInMonth || 30;
  const weeksInMonth = 4;
  const daysPerWeek = Math.ceil(daysInMonth / weeksInMonth);
  
  // Create week labels
  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  // Create datasets for each product type
  const datasets = [];
  const legendItems = [];
  const salesByType = salesSummary.salesByType || {};
  
  console.log('Creating chart - salesByType:', salesByType);
  console.log('Product types found:', Object.keys(salesByType));
  
  Object.keys(salesByType).forEach(productType => {
    const color = productTypeColors[productType] || productTypeColors['Other'];
    const weeklySales = [0, 0, 0, 0];
    
    // Sum sales for each week
    salesByType[productType].forEach((dailySale, dayIndex) => {
      const weekIndex = Math.floor(dayIndex / daysPerWeek);
      if (weekIndex < 4) {
        weeklySales[weekIndex] += dailySale || 0;
      }
    });
    
    datasets.push({
      data: weeklySales,
      color: (opacity = 1) => color,
      strokeWidth: 2.5
    });
    
    legendItems.push({
      label: productType,
      color: color
    });
  });

  // If no product types, show total sales as fallback
  if (datasets.length === 0) {
    const weeklySales = [0, 0, 0, 0];
    salesSummary.monthlySales.forEach((dailySale, dayIndex) => {
      const weekIndex = Math.floor(dayIndex / daysPerWeek);
      if (weekIndex < 4) {
        weeklySales[weekIndex] += dailySale || 0;
      }
    });
    
    datasets.push({
      data: weeklySales,
      color: (opacity = 1) => `rgba(0, 191, 165, ${opacity})`,
      strokeWidth: 3
    });
  }

  const chartData = {
    labels: weekLabels,
    datasets: datasets
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D22B2B" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logo_maroon.png')}
            style={styles.logoImage}/>
          <TouchableOpacity>
            <Icon name="notifications" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* KPIs */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₱{salesSummary.todayRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          <View style={[styles.statCard, styles.ordersCard]}>
            <Text style={styles.statValue}>{salesSummary.todayOrders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
        </View>

        {/* Monthly Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tab, activeMonth === index && styles.activeTab]}
                onPress={() => setActiveMonth(index)}
              >
                <Text style={[styles.tabText, activeMonth === index && styles.activeTabText]}>{month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Graph */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 15 }}
          />
          
          {/* Legend for product types */}
          {legendItems.length > 0 && (
            <View style={styles.legendContainer}>
              {legendItems.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Summary stats below the legend */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Sales ({months[activeMonth]})</Text>
              <Text style={styles.summaryValue}>
                ₱{salesSummary.monthlySales.reduce((sum, val) => sum + (val || 0), 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Daily Sales</Text>
              <Text style={styles.summaryValue}>
                ₱{(salesSummary.monthlySales.reduce((sum, val) => sum + (val || 0), 0) / daysInMonth).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Selling Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Selling Products</Text>
          {topProducts.length === 0 && (
            <Text style={styles.noDataText}>No sales data yet</Text>
          )}
        </View>
        {topProducts.length > 0 && (
          <FlatList
            horizontal
            data={topProducts}
            renderItem={({ item }) => <ProductCard product={item} />}
            keyExtractor={item => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        )}
        {/* Add some bottom padding so content doesn't get hidden behind nav */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorHomePage')}>
          <Icon name="home" size={22} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary, fontWeight: 'bold' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesPage')}>
          <Icon name="stats-chart-outline" size={22} color="#555" />
          <Text style={styles.navText}>Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateOrder')}>
          <Icon name="add-circle-outline" size={22} color="#555" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TransactionPage')}>
          <Icon name="receipt-outline" size={22} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorProfilePage')}>
          <Icon name="person-outline" size={22} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
  width: 150,
  height: 50,
  resizeMode: 'contain',
  marginLeft: -50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 20,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersCard: {
    backgroundColor: Colors.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  tab: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    color: '#000',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  chartContainer: {
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D22B2B',
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  productsList: {
    paddingLeft: 5,
  },
  productCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
  },
  productImage: {
    width: 130,
    height: 130,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    minHeight: 35,
  },
  soldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  soldText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
  },
  noDataText: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  productPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
    marginTop: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 65,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
    color: '#555',
  },
});

export default VendorHomePage;