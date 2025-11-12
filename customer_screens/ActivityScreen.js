import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';

const sampleTransactions = [
  { id: '1', store: 'Shawarma Store', date: 'Jan 15, 2025', amount: '₱125.00', type: 'Cash' },
  { id: '2', store: 'Siomai Store', date: 'Jan 25, 2025', amount: '₱75.00', type: 'Points' },
  { id: '3', store: 'Pares Palace', date: 'Feb 2, 2025', amount: '₱210.00', type: 'Cash' },
];

export default function ActivityScreen({ navigation }) {
  const [filter, setFilter] = useState('All');

  const filtered = sampleTransactions.filter(txn => filter === 'All' ? true : txn.type === filter);

  const renderTransaction = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.storeName}>{item.store}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>
    </View>
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
        {['All', 'Points', 'Cash'].map(s => (
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

      <FlatList
        data={filtered}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.empty}><Text style={styles.emptyText}>No transactions yet</Text></View>
        )}
      />

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
  dateText: { color: Colors.textSecondary, marginTop: 6 },
  amount: { fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#eee' },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },
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
