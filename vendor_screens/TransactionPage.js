import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,
  TouchableOpacity, FlatList, SafeAreaView,
  ActivityIndicator, Alert, } from 'react-native';
import FontAwesome from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService'; // ✅ adjust path if needed
import { Colors } from '../styles/theme';

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

  const getCustomerDisplayData = (txn) => {
    // Extract customer data from different possible sources
    const customer = txn.users || txn.customer || {};
    const firstName = customer.first_name || customer.firstName || '';
    const lastName = customer.last_name || customer.lastName || '';
    const username = customer.username || '';
    
    // Generate display name ONLY from first_name and last_name from database
    let displayName = '';
    
    // Extract first_name and last_name from database
    const dbFirstName = (customer.first_name || '').trim();
    const dbLastName = (customer.last_name || '').trim();
    
    // Combine ONLY first_name and last_name - no username fallback
    if (dbFirstName && dbLastName) {
      displayName = `${dbFirstName} ${dbLastName}`;
    } else if (dbFirstName) {
      displayName = dbFirstName;
    } else if (dbLastName) {
      displayName = dbLastName;
    } else {
      // Show generic customer when no first/last name in database
      displayName = `Customer (ID: ${txn.user_id})`;
    }
    
    // Generate initials ONLY from first_name and last_name
    let initials = '';
    if (dbFirstName && dbLastName) {
      initials = (dbFirstName.charAt(0) + dbLastName.charAt(0)).toUpperCase();
    } else if (dbFirstName) {
      initials = dbFirstName.charAt(0).toUpperCase();
    } else if (dbLastName) {
      initials = dbLastName.charAt(0).toUpperCase();
    } else {
      // Default when no first/last name in database
      initials = 'C';
    }
    
    return { displayName, initials };
  };

  const formatAndGroupTransactions = (txnData) => {
    // 1. Group transactions by reference_number and normalize timestamp
    const grouped = {};

    (txnData || []).forEach(txn => {
      const refNum = txn.reference_number;
      const transactionDate = new Date(txn.transaction_date);
      const customerData = getCustomerDisplayData(txn);
      
      // Create a unique key combining reference number and date (to handle same ref on different days)
      const groupKey = `${refNum}_${transactionDate.toDateString()}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          id: refNum,
          reference_number: refNum,
          customer_name: customerData.displayName,
          customer_initials: customerData.initials,
          transaction_date: txn.transaction_date,
          transaction_timestamp: transactionDate.getTime(), // For sorting
          total: 0,
          type: txn.transaction_type || 'Purchase',
          items: [], // Track individual items
        };
      }
      
      // Add item details
      grouped[groupKey].items.push({
        product_name: txn.products?.product_name || txn.product_name || 'Unknown Product',
        quantity: txn.quantity || 1,
        price: parseFloat(txn.price || 0),
        item_total: parseFloat(txn.price || 0) * parseFloat(txn.quantity || 1)
      });
      
      // Calculate total amount for the group
      const itemTotal = parseFloat(txn.price || 0) * parseFloat(txn.quantity || 1);
      grouped[groupKey].total += isNaN(itemTotal) ? 0 : itemTotal;
    });

    // 2. Convert to array, sort by timestamp (newest first), and finalize formatting
    return Object.values(grouped)
      .sort((a, b) => b.transaction_timestamp - a.transaction_timestamp) // Sort by timestamp descending
      .map(txn => ({
        ...txn,
        transaction_date: formatDate(txn.transaction_date),
        total: txn.total.toFixed(2), // Format total for display
        items_count: txn.items.length, // Add count for display
      }));
  };

  const fetchTransactions = async () => {
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

      // If still empty, show empty list (no need to throw)
      const cleanedAndGroupedData = formatAndGroupTransactions(txns || []);
      setTransactions(cleanedAndGroupedData);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      Alert.alert('Error', 'Failed to load vendor transactions. Please check your connection.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions =
    activeFilter === 'All'
      ? transactions
      : transactions.filter((t) => t.type === activeFilter);

  const renderTransaction = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionRow}
      onPress={() => navigation.navigate('VTransactionDetail', {
        referenceNumber: item.reference_number,
        transaction: item
      })}
      activeOpacity={0.7}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.transactionDate}>On {item.transaction_date}</Text>
        <Text style={styles.transactionRef}>Ref: {item.reference_number}</Text>
        {item.items_count > 1 && (
          <Text style={styles.itemsCount}>{item.items_count} items</Text>
        )}
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.transactionAmount}>₱{item.total}</Text>
        <Text style={[styles.transactionType, {color: item.type === 'Purchase' ? '#00A000' : '#D22B2B'}]}>
          {item.type}
        </Text>
      </View>
    </TouchableOpacity>
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
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorHomePage')}>
          <FontAwesome name="home" size={22} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesPage')}>
          <FontAwesome name="stats-chart-outline" size={22} color="#555" />
          <Text style={styles.navText}>Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateOrder')}>
          <FontAwesome name="add-circle-outline" size={22} color="#555" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}onPress={() => navigation.navigate('TransactionPage')}>
          <FontAwesome name="receipt-outline" size={22} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary, fontWeight: 'bold' }]}>Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VendorProfilePage')}>
          <FontAwesome name="person-outline" size={22} color="#555" />
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 10,
  },
  filterBtn: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginHorizontal: 4,
  },
  activeFilterBtn: {
    backgroundColor: Colors.primary,
  },
  outlinedFilterBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  filterText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
  },
  outlinedFilterText: {
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
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
    backgroundColor: Colors.primary,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  transactionRef: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemsCount: {
    fontSize: 11,
    color: '#000000ff',
    marginTop: 2,
    fontWeight: '400',
  },
  transactionType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 54,
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