import React, { useState, useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet,
  SafeAreaView, TouchableOpacity, FlatList,
  ActivityIndicator, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../../styles/theme';
import apiService from '../../../services/apiService';
import { ThemedAlert, showThemedAlert } from '../../../components/ThemedAlert';
import ScreenHeader from '../../../components/ScreenHeader';

export default function ActivityScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Get customer from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        showThemedAlert(setAlert, 'Error', 'User not found. Please login again.');
        navigation.navigate('SignIn');
        return;
      }

      const userData = JSON.parse(userDataStr);
      const customerId = userData.user_id;

      // Fetch transactions from API
      const response = await apiService.getUserTransactions(customerId, 'customer');
      
      if (response && response.transactions) {
        // Format transactions for display
        const formattedTransactions = formatTransactions(response.transactions);
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showThemedAlert(setAlert, 'Error', 'Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTransactions = (txnData) => {
    // Group transactions by reference_number to match TransactionDetailsScreen behavior
    const grouped = {};
    
    (txnData || []).forEach(txn => {
      const refNum = txn.reference_number;
      if (!grouped[refNum]) {
        // Normalize transaction type for filtering
        let txnType = txn.transaction_type || 'Purchase';
        // Handle various type formats
        if (txnType.toLowerCase().includes('redeem')) {
          txnType = 'Redemption';
        } else if (txnType.toLowerCase().includes('purchase')) {
          txnType = 'Purchase';
        }
        
        grouped[refNum] = {
          id: refNum,
          reference_number: refNum,
          store: txn.stores?.store_name || 'Unknown Store',
          date: formatDate(txn.transaction_date),
          total: 0,
          points: 0,
          type: txnType,
          itemCount: 0
        };
      }
      
      // Sum up total, points, and item quantities for this reference
      const itemTotal = txn.total != null ? parseFloat(txn.total) : (parseFloat(txn.price || 0) * parseFloat(txn.quantity || 0));
      grouped[refNum].total += isNaN(itemTotal) ? 0 : itemTotal;
      grouped[refNum].points += parseFloat(txn.points || 0);
      grouped[refNum].itemCount += parseInt(txn.quantity || 0);
    });

    // Convert to array and format
    return Object.values(grouped).map(txn => ({
      ...txn,
      amount: `₱${txn.total.toFixed(2)}`,
      pointsEarned: txn.type === 'Redemption' 
        ? `-${Math.round(Math.abs(txn.points))} pts` 
        : `+${Math.round(Math.abs(txn.points))} pts`,
      items: [{ quantity: txn.itemCount }] // Keep for compatibility
    }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const filtered = transactions.filter(txn => {
    if (filter === 'All') return true;
    if (filter === 'Purchase') return txn.type === 'Purchase';
    if (filter === 'Redemption') return txn.type === 'Redemption';
    return true;
  });
  const emptyTitle = filter === 'All' ? 'No transactions yet' : `No ${filter.toLowerCase()}s yet`;
  const emptySubtitle = filter === 'All'
    ? 'Your transactions will appear here'
    : `Your ${filter.toLowerCase()}s will appear here`;

  const toggleSidebar = () => {
    const nextOpen = !sidebarOpen;
    setSidebarOpen(nextOpen);
    Animated.timing(sidebarProgress, {
      toValue: nextOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  console.log('=== ACTIVITY SCREEN FILTER DEBUG ===');
  console.log('Current filter:', filter);
  console.log('Total transactions:', transactions.length);
  console.log('Filtered transactions:', filtered.length);
  console.log('Transaction types:', transactions.map(t => ({ ref: t.reference_number, type: t.type })));

  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('TransactionDetails', {
          referenceNumber: item.reference_number,
          initial: item,
        })
      }
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.storeName}>{item.store}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.itemsText}>{item.itemCount} item(s)</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{item.amount}</Text>
          <Text style={styles.pointsText}>{item.pointsEarned}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScreenHeader title="Transaction History" />

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: sidebarProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 112],
              }),
              opacity: sidebarProgress,
            },
          ]}
          pointerEvents={sidebarOpen ? 'auto' : 'none'}
          accessibilityElementsHidden={!sidebarOpen}
          importantForAccessibility={sidebarOpen ? 'auto' : 'no-hide-descendants'}
        >
          {['All', 'Purchase', 'Redemption'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sidebarItem, filter === s && styles.sidebarItemActive]}
              onPress={() => setFilter(s)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === s }}
            >
              <Text style={[styles.sidebarText, filter === s && styles.sidebarTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <TouchableOpacity
          style={styles.sidebarToggle}
          onPress={toggleSidebar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={sidebarOpen ? 'Close filters' : 'Open filters'}
        >
          <FontAwesome name={sidebarOpen ? 'angle-left' : 'angle-right'} size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderTransaction}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={() => (
                <View style={styles.empty}>
                  <FontAwesome name="inbox" size={50} color="#ccc" />
                  <Text style={styles.emptyText}>{emptyTitle}</Text>
                  <Text style={styles.emptySubtext}>{emptySubtitle}</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('HomePage')}>
          <FontAwesome name="home" size={20} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('Stores')}>
          <Ionicons name="storefront-outline" size={22} color="#555" />
          <Text style={styles.navText}>Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ScannerScreen')}>
          <FontAwesome name="qrcode" size={20} color="#555" />
          <Text style={styles.navText}>QR Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ActivityScreen')}>
          <FontAwesome name="list-alt" size={20} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary }]}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ProfilePage')}>
          <FontAwesome name="user-o" size={20} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 80 }} />
      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    padding: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    backgroundColor: '#fafafa',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  sidebarToggle: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    backgroundColor: '#fff',
  },
  sidebarItem: {
    width: '100%',
    borderRadius: Radii.xl || 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    
  },
  sidebarItemActive: {
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: '#000',
  },
  sidebarText: { color: Colors.primary, fontWeight: '600', fontSize: Typography.small },
  sidebarTextActive: { color: '#fff' },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 20 },
  row: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1 },
  right: { width: 100, alignItems: 'flex-end' },
  storeName: { fontWeight: '700', fontSize: Typography.body },
  dateText: { color: Colors.textSecondary, marginTop: 4, fontSize: 13 },
  itemsText: { color: Colors.textSecondary, marginTop: 2, fontSize: 12 },
  amount: { fontWeight: '700', fontSize: 16 },
  pointsText: { color: Colors.primary, marginTop: 4, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { marginTop: 16, color: Colors.textSecondary, fontSize: 14 },
  empty: { padding: 30, alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: Colors.textSecondary, fontSize: 14, marginTop: 8 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 65,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
    color: '#555',
  },
});
