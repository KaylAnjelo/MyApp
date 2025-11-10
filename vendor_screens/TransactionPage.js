import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService'; // ✅ adjust path if needed

const filters = ['All', 'Points', 'Cash'];

const TransactionPage = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ Fetch transactions for the logged-in user
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const userData = await AsyncStorage.getItem('@app_user');
      const parsedUser = JSON.parse(userData);

      if (!parsedUser?.user_id) {
        console.warn('No user_id found in AsyncStorage');
        setLoading(false);
        return;
      }

      const data = await apiService.getUserTransactions(parsedUser.user_id);

      // ✅ Keep only the columns you want (user_id, transaction_date, total)
      const cleanedData = data.map((t) => ({
        user_id: t.user_id,
        transaction_date: t.transaction_date,
        total: t.total,
      }));

      setTransactions(cleanedData);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
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
        <Text style={styles.customerName}>User ID: {item.user_id}</Text>
        <Text style={styles.transactionDate}>On {item.transaction_date}</Text>
      </View>
      <Text style={styles.transactionAmount}>₱{item.total}</Text>
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
              activeFilter === filter
                ? styles.activeFilterBtn
                : styles.outlinedFilterBtn,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter
                  ? styles.activeFilterText
                  : styles.outlinedFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      {loading ? (
        <ActivityIndicator size="large" color="#D22B2B" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => item.user_id + index}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>
              No transactions found.
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
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    backgroundColor: '#D22B2B',
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
    backgroundColor: '#D22B2B',
  },
  outlinedFilterBtn: {
    borderWidth: 1,
    borderColor: '#D22B2B',
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
    color: '#D22B2B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 14,
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
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D22B2B',
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

export default TransactionPage;
