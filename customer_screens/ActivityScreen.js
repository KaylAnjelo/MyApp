import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet,
  SafeAreaView, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function ActivityScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Get customer from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        Alert.alert('Error', 'User not found. Please login again.');
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
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
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
        grouped[refNum] = {
          id: refNum,
          reference_number: refNum,
          store: txn.stores?.store_name || 'Unknown Store',
          date: formatDate(txn.transaction_date),
          total: 0,
          points: 0,
          type: txn.transaction_type || 'Purchase',
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
      pointsEarned: `+${txn.points} pts`,
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
      <View style={styles.header}>
        {/* Spacer to center the title (no back chevron) */}
        <View style={{ width: 36 }} />
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.segmentRow}>
        {['All', 'Purchase', 'Redemption'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.segment, filter === s && styles.segmentActive]}
            onPress={() => setFilter(s)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, filter === s && styles.segmentTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
              <Text style={styles.emptyText}>No redemptions yet</Text>
              <Text style={styles.emptySubtext}>Your redemptions will appear here</Text>
            </View>
          )}
        />
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: Typography.h3, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', padding: Spacing.lg, justifyContent: 'space-between' },
  segment: {
    borderRadius: Radii.xl || 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  segmentActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000' },
  segmentText: { color: Colors.primary, fontWeight: '600' },
  segmentTextActive: { color: Colors.primary },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
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
    justifyContent: 'space-around',
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
    alignItems: 'center',
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
    color: '#555',
  },
});
