import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../styles/theme';
import apiService from '../services/apiService';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Color palette for product types
const productTypeColors = {
  'Meal': '#D22B2B',
  'Beverages': '#FF6B6B',
  'Sides': '#FFA500',
  'Dessert': '#FFD700',
  'Merchandise': '#8B4513',
  'Other': '#696969'
};

const SalesPage = ({ navigation }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    weeklyPerformance: [],
    topProducts: [],
    salesByType: {},
    transactionProgress: { current: 0, target: 0 }
  });

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

    // Group transactions by week and product type for salesByType
    const weeklySalesByType = { 0: {}, 1: {}, 2: {}, 3: {} }; // Weeks 1-4
    const productRevenue = {};
    let totalOrders = 0;

    txns.forEach(txn => {
      const txnDate = new Date(txn.transaction_date);
      const txnDateStr = txnDate.toDateString();
      const week = Math.floor((txnDate.getDate() - 1) / 7); // 0-3 for weeks
      const productType = txn.products?.category || txn.category || 'Other';
      const revenue = parseFloat(txn.price || 0) * parseFloat(txn.quantity || 1);

      // Today's metrics
      if (txnDateStr === todayStr) {
        todayRevenue += revenue;
        todayOrders.add(txn.reference_number);
      }

      // Weekly sales by type
      if (!weeklySalesByType[week]) weeklySalesByType[week] = {};
      weeklySalesByType[week][productType] = (weeklySalesByType[week][productType] || 0) + revenue;

      // Top products
      const productName = txn.products?.product_name || txn.product_name || 'Unknown Product';
      productRevenue[productName] = (productRevenue[productName] || 0) + revenue;

      totalOrders += 1; // Assuming each txn is an order item, but for progress, count unique reference_numbers
    });

    const todayOrdersCount = todayOrders.size;

    // Prepare salesByType as array of weekly revenues per type
    const salesByType = {};
    Object.keys(productTypeColors).forEach(type => {
      salesByType[type] = [0, 0, 0, 0];
    });
    Object.keys(weeklySalesByType).forEach(week => {
      Object.keys(weeklySalesByType[week]).forEach(type => {
        salesByType[type][week] = weeklySalesByType[week][type];
      });
    });

    // Top products
    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    // Weekly performance (total revenue per week)
    const weeklyPerformance = [0, 0, 0, 0];
    Object.keys(weeklySalesByType).forEach(week => {
      weeklyPerformance[week] = Object.values(weeklySalesByType[week]).reduce((sum, val) => sum + val, 0);
    });

    // Transaction progress: current is total unique orders in month, target is arbitrary (e.g., 100)
    const uniqueOrders = new Set(txns.map(t => t.reference_number)).size;
    const target = 100; // Example target, can be adjusted

    setAnalyticsData({
      todayRevenue,
      todayOrders: todayOrdersCount,
      weeklyPerformance,
      topProducts,
      salesByType,
      transactionProgress: { current: uniqueOrders, target }
    });
  };

  // Prepare line chart data for weekly performance by product type
  const lineChartDatasets = [];
  const legendItems = [];
  const salesByType = analyticsData.salesByType || {};

  Object.keys(salesByType).forEach(productType => {
    const color = productTypeColors[productType] || productTypeColors['Other'];
    lineChartDatasets.push({
      data: salesByType[productType],
      color: (opacity = 1) => color,
      strokeWidth: 2.5
    });
    legendItems.push({ label: productType, color });
  });

  // Fallback if no product types
  if (lineChartDatasets.length === 0) {
    const weeklyRevenue = (analyticsData.weeklyPerformance || []).map(w => w.revenue || 0);
    lineChartDatasets.push({
      data: weeklyRevenue.length > 0 ? weeklyRevenue : [0, 0, 0, 0],
      color: (opacity = 1) => `rgba(0, 191, 165, ${opacity})`,
      strokeWidth: 3
    });
  }

  const lineChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: lineChartDatasets
  };

  // Prepare bar chart data for top products
  const topProducts = analyticsData.topProducts || [];
  const barChartData = {
    labels: topProducts.slice(0, 5).map(p => p.name.substring(0, 8)),
    datasets: [{
      data: topProducts.slice(0, 5).map(p => p.revenue || 0)
    }]
  };

  // Progress bar values
  const progressValue = analyticsData.transactionProgress?.current || 0;
  const progressMax = analyticsData.transactionProgress?.target || 1;
  const progressPercent = Math.round((progressValue / progressMax) * 100);

  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>My Sales</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D22B2B" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>My Sales</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>₱{analyticsData.todayRevenue.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{analyticsData.todayOrders}</Text>
            <Text style={styles.summaryLabel}>Today's Orders</Text>
          </View>
        </View>

        {/* Month Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthTabsScroll}>
          <View style={styles.monthTabs}>
            {months.map((month, idx) => (
              <TouchableOpacity
                key={month}
                style={[styles.monthTab, activeMonth === idx && styles.activeMonthTab]}
                onPress={() => setActiveMonth(idx)}
              >
                <Text style={[styles.monthTabText, activeMonth === idx && styles.activeMonthTabText]}>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sales Performance Chart */}
        <Text style={styles.sectionTitle}>Sales Performance by Product Type</Text>
        <LineChart
          data={lineChartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#fff"
            }
          }}
          bezier
          style={{ borderRadius: 15, marginBottom: 10 }}
        />
        
        {/* Legend */}
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

        {/* Transactions Progress Bar */}
        <Text style={styles.sectionTitle}>Monthly Orders Progress</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressValue} / {progressMax} orders ({progressPercent}%)</Text>
        </View>

        {/* Top Selling Products Bar Chart */}
        <Text style={styles.sectionTitle}>Top Selling Products (Revenue)</Text>
        {topProducts.length > 0 ? (
          <BarChart
            data={barChartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(210, 43, 43, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              barPercentage: 0.6,
            }}
            fromZero
            showValuesOnTopOfBars
            style={{ borderRadius: 15, marginBottom: 80 }}
            yAxisLabel="₱"
          />
        ) : (
          <Text style={styles.noDataText}>No product sales data yet</Text>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorHomePage')}>
          <Icon name="home" size={22} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesPage')}>
          <Icon name="stats-chart-outline" size={22} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary, fontWeight: 'bold' }]}>Sales</Text>
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
  headerBar: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 20,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  monthTabsScroll: {
    marginBottom: 18,
  },
  monthTabs: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  monthTab: {
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
  },
  activeMonthTab: {
    backgroundColor: Colors.primary,
  },
  monthTabText: {
    color: '#333',
    fontWeight: '600',
  },
  activeMonthTabText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#222',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    borderRadius: 10,
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
  noDataText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default SalesPage;