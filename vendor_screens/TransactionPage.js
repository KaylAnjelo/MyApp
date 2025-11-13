import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert, // Added Alert for error handling
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

const filters = ['All', 'Purchase', 'Redemption']; // Corrected filter names to match backend 'transaction_type'

const TransactionPage = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatAndGroupTransactions = (txnData) => {
    // 1. Group transactions by reference_number to treat each sale as one entry
    const grouped = {};

    (txnData || []).forEach(txn => {
      const refNum = txn.reference_number;
      if (!grouped[refNum]) {
        grouped[refNum] = {
          id: refNum,
          reference_number: refNum,
          customer_name: txn.users?.username || 'Customer (ID: ' + txn.user_id + ')', // Use the 'users' relation defined in getStoreTransactions
          transaction_date: txn.transaction_date,
          total: 0,
          type: txn.transaction_type || 'Purchase',
        };
      }
      
      // Calculate total amount for the group. We use price * quantity since transaction entries are item-level
      const itemTotal = parseFloat(txn.price || 0) * parseFloat(txn.quantity || 0);
      grouped[refNum].total += isNaN(itemTotal) ? 0 : itemTotal;
    });

    // 2. Convert to array and finalize formatting
    return Object.values(grouped).map(txn => ({
      ...txn,
      transaction_date: formatDate(txn.transaction_date),
      total: txn.total.toFixed(2), // Format total for display
    }));
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const userData = await AsyncStorage.getItem('@app_user');
      const parsedUser = JSON.parse(userData);

      if (!parsedUser || parsedUser.role !== 'vendor' || !parsedUser.store_id) {
        Alert.alert('Error', 'Vendor or Store ID not found. Please relog.');
        setLoading(false);
        return;
      }

      // Vendor: fetch all transactions for their store
      // The backend returns { transactions: data }
      const response = await apiService.getStoreTransactions(parsedUser.store_id);
      
      if (!response || !response.transactions) {
          throw new Error('Invalid response structure from API.');
      }
      
      // Use the new grouping and formatting function
      const cleanedAndGroupedData = formatAndGroupTransactions(response.transactions);

      setTransactions(cleanedAndGroupedData);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      Alert.alert('Error', 'Failed to load store transactions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions =
    activeFilter === 'All'
      ? transactions
      : transactions.filter((t) => t.type === activeFilter);

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionRow}>
      <View style={styles.avatarPlaceholder} />
      <View style={styles.transactionInfo}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.transactionDate}>On {item.transaction_date}</Text>
        <Text style={styles.transactionRef}>Ref: {item.reference_number}</Text>
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.transactionAmount}>₱{item.total}</Text>
        <Text style={[styles.transactionType, {color: item.type === 'Purchase' ? '#00A000' : '#D22B2B'}]}>
          {item.type}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterBtn,
              activeFilter === filter ? styles.activeFilterBtn : styles.outlinedFilterBtn,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter ? styles.activeFilterText : styles.outlinedFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#D22B2B"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id} // Use the grouped reference_number as the key
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>
              No transactions found for this store.
            </Text>
          )}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('VendorHomePage')}
        >
          <Icon name="home" size={22} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('SalesPage')}
        >
          <Icon name="stats-chart-outline" size={22} color="#555" />
          <Text style={styles.navText}>Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('CreateOrder')}
        >
          <Icon name="add-circle-outline" size={22} color="#555" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('TransactionPage')}
        >
          <Icon name="receipt-outline" size={22} color="#D22B2B" />
          <Text style={[styles.navText, { color: '#D22B2B', fontWeight: 'bold' }]}>
            Transactions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('VendorProfilePage')}
        >
          <Icon name="person-outline" size={22} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  headerBar: { backgroundColor: '#D22B2B', paddingVertical: 18, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16, gap: 10 },
  filterBtn: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 22, marginHorizontal: 4 },
  activeFilterBtn: { backgroundColor: '#D22B2B' },
  outlinedFilterBtn: { borderWidth: 1, borderColor: '#D22B2B', backgroundColor: '#fff' },
  filterText: { fontWeight: 'bold', fontSize: 14 },
  activeFilterText: { color: '#fff' },
  outlinedFilterText: { color: '#D22B2B' }, // Replaced the incomplete style
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 15,
  },
  transactionInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600' },
  transactionDate: { fontSize: 12, color: '#888', marginTop: 2 },
  transactionRef: { fontSize: 11, color: '#ccc', marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  transactionType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 55 },
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
    paddingBottom: 5,
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

export default TransactionPage;