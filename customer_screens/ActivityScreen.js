import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Platform, // Import Platform for safe area handling
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
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
    // Change to regular View and use wrapper styles on the container
    <View style={styles.container}> 
      
      {/* HEADER: Matching the fixed, centered style from Profile/Stores screens */}
      <View style={styles.fixedHeaderWrapper}>
        <View style={styles.newHeader}>
          {/* Left spacer/back button placeholder */}
          <View style={styles.headerSpacer} />
          <Text style={styles.newHeaderTitle}>Activity</Text>
          {/* Right placeholder (e.g., settings icon) */}
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <SafeAreaView style={styles.contentWrapper}>
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
      </SafeAreaView>
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePage')}>
          <Icon name="home" size={20} color="#555" />
          <Text style={[styles.navText, { color: '#555' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Stores')}>
          <Ionicons name="storefront-outline" size={22} color="#555" />
          <Text style={styles.navText}>Stores</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ScannerScreen')}>
          <Icon name="qrcode" size={20} color="#555" />
          <Text style={styles.navText}>QR Scan</Text>
        </TouchableOpacity>
        <View style={styles.navItem}>
          <Icon name="list-alt" size={20} color="#7D0006" />
          <Text style={[styles.navText, { color: '#7D0006', fontWeight: 'bold' }]}>Activity</Text>
        </View>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfilePage')}>
          <Icon name="user-o" size={20} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // New container style for the whole screen
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Wrapper for the scrollable content, offsetting the fixed header and bottom nav
  contentWrapper: { 
    flex: 1, 
    marginTop: 80, // Space for the fixed header
    paddingBottom: 65, // Space for the fixed bottom nav (if not using SafeAreaView margin)
  },
  
  // NEW STYLES FOR FIXED HEADER (Copied and adapted from ProfilePageScreen)
  fixedHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensure header is above content
    backgroundColor: Colors.white, 
    paddingTop: Platform.OS === 'android' ? 10 : 50, // Added platform-specific padding for safe area/status bar
    borderBottomWidth: 1, // Subtle border line
    borderBottomColor: '#eee',
  },
  newHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg, 
    paddingBottom: Spacing.md, 
  },
  newHeaderTitle: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 24, // Matches the explicit spacer width used in the previous component
  },
  
  // ORIGINAL STYLES (Adjusted or Kept)
  // wrapper: { flex: 1, backgroundColor: '#fff' }, // Replaced by 'container'
  // header: { ... }, // Old red header removed/replaced
  // title: { ... }, // Old white title removed/replaced
  
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