import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedAlert, showThemedAlert } from '../components/ThemedAlert';
import Icon from 'react-native-vector-icons/Ionicons';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '../styles/theme';
import apiService from '../services/apiService';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Color palette for product types
const productTypeColors = {
  'Meals': '#C0392B',
  'Beverages': '#16A085',
  'Sides': '#F39C12',
  'Dessert': '#D35400',
  'Merchandise': '#8E44AD',
  'Other': '#7F8C8D'
};

const SalesPage = ({ navigation }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [analyticsData, setAnalyticsData] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    salesByType: {},
    monthlyOrders: 0
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
        showThemedAlert(setAlert, 'Error', 'User not found. Please login again.');
        navigation.replace('SignIn');
        return;
      }

      const userData = JSON.parse(userDataStr);
      const vendorStoreId = userData.store_id;

      if (!vendorStoreId) {
        showThemedAlert(setAlert, 'Error', 'Store not assigned to this vendor.');
        return;
      }

      setStoreId(vendorStoreId);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showThemedAlert(setAlert, 'Error', 'Failed to load initial data.');
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
        showThemedAlert(setAlert, 'Error', 'Vendor or User ID not found. Please relog.');
        setLoading(false);
        return;
      }

      const userId = parsedUser.user_id;
      let response = null;
      let txns = [];

      console.log('🔍 SalesPage: Loading transactions for userId:', userId, 'storeId:', storeId);

      // 1) Primary: try user-specific endpoint (common signature)
      try {
        response = await apiService.getUserTransactions(userId, 'vendor');
        console.log('✅ getUserTransactions response:', JSON.stringify(response).substring(0, 200));
        if (response && Array.isArray(response.transactions) && response.transactions.length > 0) {
          txns = response.transactions;
          console.log(`✅ Found ${txns.length} transactions from getUserTransactions`);
        }
      } catch (err) {
        console.log('❌ getUserTransactions(userId, "vendor") failed:', err?.message || err);
      }

      // 2) Secondary: try user-specific without role (some apiService variants)
      if (txns.length === 0) {
        try {
          response = await apiService.getUserTransactions(userId);
          console.log('✅ getUserTransactions (no role) response:', JSON.stringify(response).substring(0, 200));
          if (response && Array.isArray(response.transactions) && response.transactions.length > 0) {
            txns = response.transactions;
            console.log(`✅ Found ${txns.length} transactions from getUserTransactions (no role)`);
          }
        } catch (err) {
          console.log('❌ getUserTransactions(userId) failed:', err?.message || err);
        }
      }

      // 3) Fallback: fetch store transactions and filter by Vendor_ID === userId
      if (txns.length === 0 && parsedUser.store_id) {
        try {
          const storeResp = await apiService.getStoreTransactions(parsedUser.store_id);
          console.log('✅ getStoreTransactions response:', JSON.stringify(storeResp).substring(0, 200));
          if (storeResp && Array.isArray(storeResp.transactions)) {
            txns = storeResp.transactions.filter(t => String(t.Vendor_ID) === String(userId));
            console.log(`✅ Found ${txns.length} transactions after filtering by Vendor_ID`);
          }
        } catch (err) {
          console.log('❌ getStoreTransactions fallback failed:', err?.message || err);
        }
      }

      console.log(`📊 Total transactions before filtering: ${txns.length}`);

      // Filter transactions by selected month and year
      const filteredTxns = txns.filter(txn => {
        if (!txn.transaction_date) return false;
        const txnDate = new Date(txn.transaction_date);
        return txnDate.getMonth() === activeMonth && txnDate.getFullYear() === currentYear;
      });

      console.log(`📊 Filtered transactions for ${months[activeMonth]}: ${filteredTxns.length}`);
      console.log('📊 Sample transaction:', filteredTxns[0] ? JSON.stringify(filteredTxns[0]).substring(0, 300) : 'none');

      setTransactions(filteredTxns);
      computeAnalytics(filteredTxns);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      showThemedAlert(setAlert, 'Error', 'Failed to load transactions.');
      setTransactions([]);
      // Set default analytics even on error
      setAnalyticsData({
        todayRevenue: 0,
        todayOrders: 0,
        salesByType: {},
        monthlyOrders: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const computeAnalytics = (txns) => {
    console.log(`📊 Computing analytics for ${txns.length} transactions`);
    
    const today = new Date();
    const todayStr = today.toDateString();
    let todayRevenue = 0;
    let todayOrders = new Set();
    let monthlyOrders = new Set();

    // Group transactions by product type for salesByType
    const salesByType = {};

    txns.forEach((txn, index) => {
      if (!txn.transaction_date) {
        console.log(`⚠️ Transaction ${index} missing transaction_date`);
        return;
      }

      const txnDate = new Date(txn.transaction_date);
      const txnDateStr = txnDate.toDateString();
      
      // Get product type from products.product_type field
      const productType = txn.products?.product_type || 'Other';
      
      // Parse price and quantity safely
      const price = parseFloat(txn.price || txn.total_price || 0);
      const quantity = parseFloat(txn.quantity || 1);
      const revenue = price * quantity;

      console.log(`📦 Txn ${index}: type=${productType}, price=${price}, qty=${quantity}, revenue=${revenue}`);

      // Today's metrics
      if (txnDateStr === todayStr) {
        todayRevenue += revenue;
        if (txn.reference_number) {
          todayOrders.add(txn.reference_number);
        }
      }

      // Monthly orders (all transactions in selected month)
      if (txn.reference_number) {
        monthlyOrders.add(txn.reference_number);
      }

      // Total sales by type
      salesByType[productType] = (salesByType[productType] || 0) + revenue;
    });

    const todayOrdersCount = todayOrders.size;
    const monthlyOrdersCount = monthlyOrders.size;

    console.log(`📊 Analytics computed:
      - Today Revenue: ₱${todayRevenue.toFixed(2)}
      - Today Orders: ${todayOrdersCount}
      - Monthly Orders: ${monthlyOrdersCount}
      - Sales by Type:`, salesByType);

    setAnalyticsData({
      todayRevenue,
      todayOrders: todayOrdersCount,
      salesByType,
      monthlyOrders: monthlyOrdersCount
    });
  };

  // Prepare pie chart data for sales by product type
  const salesByType = analyticsData.salesByType || {};
  const pieChartData = Object.entries(salesByType).map(([type, revenue]) => ({
    name: type,
    revenue: revenue,
    population: revenue,
    color: productTypeColors[type] || productTypeColors['Other'],
    legendFontColor: '#333',
    legendFontSize: 13
  }));

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

        {/* Monthly Orders Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Monthly Orders</Text>
          <View style={styles.ordersDisplay}>
            <Text style={styles.ordersCount}>{analyticsData.monthlyOrders}</Text>
            <Text style={styles.ordersLabel}>Total Orders This Month</Text>
          </View>
        </View>

        {/* Sales Distribution by Product Type */}
        <Text style={styles.sectionTitle}>Sales Distribution by Product Type</Text>
        {pieChartData.length > 0 ? (
          <>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                data={pieChartData}
                width={Dimensions.get('window').width}
                height={240}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                hasLegend={false}
                center={[85, 0]}
                absolute={false}
              />
            </View>
            <View style={styles.legendContainer}>
              {pieChartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}: ₱{item.revenue.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No sales data yet</Text>
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
      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />
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
  noDataText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  ordersDisplay: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  ordersCount: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
    fontFamily: 'System',
  },
  ordersLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
    fontFamily: 'System',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 80,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
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
});

export default SalesPage;