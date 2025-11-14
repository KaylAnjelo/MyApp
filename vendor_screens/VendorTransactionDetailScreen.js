import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function VendorTransactionDetailScreen({ route, navigation }) {
  const { referenceNumber, transaction } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]); // all rows for this reference

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const userStr = await AsyncStorage.getItem('@app_user');
        if (!userStr) throw new Error('User not found');
        const user = JSON.parse(userStr);

        if (!user.store_id) throw new Error('Store ID not found');

        // Fetch all store transactions then filter by reference
        try {
          const data = await apiService.getStoreTransactions(user.store_id);
          const all = data?.transactions || [];
          const filtered = referenceNumber
            ? all.filter(t => t.reference_number === referenceNumber)
            : [];
          setEntries(filtered);
        } catch (apiError) {
          // If API fails, use the passed transaction data as fallback
          if (transaction) {
            setEntries([transaction]);
          } else {
            throw apiError;
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [referenceNumber, transaction]);

  const grouped = useMemo(() => {
    if ((entries || []).length === 0) {
      // Fallback to passed transaction data
      if (transaction) {
        return {
          customer: transaction.customer_name,
          reference_number: transaction.reference_number,
          date: transaction.transaction_date,
          time: null,
          items: transaction.items || [],
          total: parseFloat(transaction.total || 0),
          type: transaction.type || 'Purchase',
          items_count: transaction.items_count || 1,
        };
      }
      return null;
    }

    const first = entries[0];
    const dateObj = new Date(first.transaction_date);

    const items = entries.map((t) => ({
      product_name: t.products?.product_name || t.product_name || 'Product',
      quantity: t.quantity,
      price: parseFloat(t.price || 0),
      subtotal: parseFloat(t.price || 0) * parseFloat(t.quantity || 0),
    }));

    const total = entries.reduce((sum, t) => {
      const row = t.total != null ? parseFloat(t.total) : (parseFloat(t.price || 0) * parseFloat(t.quantity || 0));
      return sum + (isNaN(row) ? 0 : row);
    }, 0);

    // Get customer name from the customer relation
    const customer = first.customer || first.users;
    const customerName = customer 
      ? `${(customer.first_name || '').trim()} ${(customer.last_name || '').trim()}`.trim() || 
        customer.username || `Customer (ID: ${first.user_id})`
      : `Customer (ID: ${first.user_id})`;

    return {
      customer: customerName,
      reference_number: first.reference_number,
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items,
      total,
      type: first.transaction_type || 'Purchase',
      items_count: items.length,
    };
  }, [entries, transaction]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.muted}>Loading transaction details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#f44336" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : !grouped ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="search" size={48} color={Colors.textSecondary} />
            <Text style={styles.muted}>Transaction not found.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {/* Customer Section */}
            <View style={styles.section}>
              <Text style={styles.customerName}>{grouped.customer}</Text>
            </View>

            {/* Reference Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.referenceValue}>{grouped.reference_number || 'N/A'}</Text>
            </View>

            {/* Date and Time Section */}
            <View style={styles.section}>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeColumn}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>{grouped.date}</Text>
                </View>
                <View style={styles.timeColumn}>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>{grouped.time || '10:30 PM'}</Text>
                </View>
              </View>
            </View>

            {/* Transaction Type Section */}
            <View style={styles.typeSection}>
              <View style={[styles.typeContainer, {
                backgroundColor: grouped.type === 'Purchase' ? '#E8F5E8' : '#FFEBEE'
              }]}>
                <Text style={[styles.transactionType, {
                  color: grouped.type === 'Purchase' ? '#00A000' : '#D22B2B'
                }]}>{grouped.type}</Text>
              </View>
            </View>

            {/* Items Section */}
            <View style={styles.itemsSection}>
              <Text style={styles.itemsTitle}>Items ({grouped.items_count})</Text>
              <View style={styles.itemsList}>
                {grouped.items.map((item, idx) => (
                  <View key={idx} style={styles.itemContainer}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity} x ₱{parseFloat(item.price || 0).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>₱{parseFloat(item.subtotal || 0).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Total Section */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₱{parseFloat(grouped.total || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.quad,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: Colors.white, fontSize: Typography.h3, fontWeight: 'bold' },
  content: { padding: Spacing.lg, paddingBottom: Spacing.quad },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  muted: { 
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  error: { 
    color: '#f44336',
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: Typography.body,
  },
  card: { 
    backgroundColor: Colors.white, 
    borderRadius: Radii.md, 
    ...Shadows.light,
    overflow: 'hidden',
  },
  section: { 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm,
  },
  customerName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.textPrimary,
  },
  label: { 
    fontSize: 12, 
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: { 
    fontSize: 14, 
    color: Colors.textPrimary, 
    fontWeight: '500',
  },
  referenceValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeColumn: {
    flex: 1,
  },
  timeColumn: {
    alignItems: 'flex-end',
  },
  transactionType: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  typeSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  typeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemsSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  itemsList: {
    paddingBottom: Spacing.sm,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  totalSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
});