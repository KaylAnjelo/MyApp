import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function TransactionDetailsScreen({ route, navigation }) {
  const { referenceNumber, initial } = route.params || {};
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

        // Fetch all user transactions then filter by reference
        const data = await apiService.getUserTransactions(user.user_id, 'customer');
        const all = data?.transactions || [];
        const filtered = referenceNumber
          ? all.filter(t => t.reference_number === referenceNumber)
          : (initial?.reference_number ? all.filter(t => t.reference_number === initial.reference_number) : []);
        setEntries(filtered);
      } catch (e) {
        setError(e.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [referenceNumber]);

  const grouped = useMemo(() => {
    // Aggregate within this reference: items, totals, store, date, points, reward info
    if ((entries || []).length === 0) {
      if (initial) {
        const total = initial.amount && typeof initial.amount === 'string' ? parseFloat(initial.amount.replace(/[^0-9.]/g, '')) : 0;
        const pts = initial.pointsEarned && typeof initial.pointsEarned === 'string' ? parseFloat(initial.pointsEarned.replace(/[^0-9.]/g, '')) : 0;
        return {
          store: initial.store || 'Unknown Store',
          reference_number: initial.reference_number,
          date: initial.date,
          time: null,
          items: initial.items || [],
          total: isNaN(total) ? 0 : total,
          points: isNaN(pts) ? 0 : pts,
          type: initial.type || 'Purchase',
          reward: initial.reward || null,
          reward_name: initial.reward_name || null,
          promo_code: initial.promo_code || null,
        };
      }
      return null;
    }

    const first = entries[0];
    const dateObj = new Date(first.transaction_date);

    const items = entries.map((t) => ({
      product_name: t.products?.product_name || 'Product',
      quantity: t.quantity,
      price: parseFloat(t.price || 0),
      subtotal: parseFloat(t.price || 0) * parseFloat(t.quantity || 0),
    }));

    const total = entries.reduce((sum, t) => {
      const row = t.total != null ? parseFloat(t.total) : (parseFloat(t.price || 0) * parseFloat(t.quantity || 0));
      return sum + (isNaN(row) ? 0 : row);
    }, 0);

    const points = entries.reduce((sum, t) => sum + parseFloat(t.points || 0), 0);

    // Check for reward/voucher info
    const reward = first.reward || first.rewards || null;
    const reward_name = first.reward_name || (reward && reward.reward_name) || null;
    const promo_code = first.promo_code || (reward && reward.promo_code) || null;

    return {
      store: first.stores?.store_name || 'Unknown Store',
      reference_number: first.reference_number,
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items,
      total,
      points, // do not round – show exact
      type: first.transaction_type || 'Purchase',
      reward,
      reward_name,
      promo_code,
    };
  }, [entries, initial]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !grouped ? (
          <Text style={styles.muted}>Transaction not found.</Text>
        ) : (
          <View style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.store}>{grouped.store}</Text>
              {/* Voucher Used badge */}
              {(grouped.type && grouped.type.toLowerCase().includes('voucher')) || grouped.reward_name ? (
                <View style={styles.voucherBadge}>
                  <FontAwesome name="ticket" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.voucherBadgeText}>Voucher Used{grouped.reward_name ? `: ${grouped.reward_name}` : ''}</Text>
                  {grouped.promo_code ? (
                    <Text style={styles.voucherPromoCode}>Code: {grouped.promo_code}</Text>
                  ) : null}
                </View>
              ) : null}
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.value}>{grouped.reference_number || 'N/A'}</Text>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>{grouped.date}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>{grouped.time || '—'}</Text>
                </View>
              </View>
              <View style={{ height: 8 }} />
              <View style={styles.pointsPill}>
                <Text style={styles.pointsText}>+{grouped.points} pts</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              {grouped.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{it.product_name}</Text>
                    <Text style={styles.muted}>{it.quantity} x ₱{parseFloat(it.price || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.itemSubtotal}>₱{parseFloat(it.subtotal || 0).toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₱{parseFloat(grouped.total || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>{grouped.type}</Text>
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
  content: { 
    flexGrow: 1,
    padding: Spacing.lg, 
    paddingBottom: Spacing.sm 
  },
  muted: { color: Colors.textSecondary },
  error: { color: 'red' },
  card: { backgroundColor: Colors.white, borderRadius: Radii.md, ...Shadows.light },
  section: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#eee' },
  store: { fontSize: Typography.h3, fontWeight: '700', marginBottom: Spacing.sm, color: Colors.textPrimary },
  label: { fontSize: Typography.small, color: Colors.textSecondary },
  value: { fontSize: Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  pointsPill: { alignSelf: 'flex-start', backgroundColor: '#EEF6FF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pointsText: { color: Colors.primary, fontWeight: '700' },
  sectionTitle: { fontSize: Typography.body, fontWeight: '700', marginBottom: Spacing.sm, color: Colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontSize: Typography.body, color: Colors.textPrimary },
  itemSubtotal: { fontWeight: '700', color: Colors.textPrimary },
  totalLabel: { fontSize: Typography.body, color: Colors.textSecondary },
  totalValue: { fontSize: Typography.h3, fontWeight: '700', color: Colors.textPrimary },
  voucherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  voucherBadgeText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: Typography.body,
    marginRight: 8,
  },
  voucherPromoCode: {
    color: Colors.textSecondary,
    fontSize: Typography.small,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
