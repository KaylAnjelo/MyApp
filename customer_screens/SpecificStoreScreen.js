import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SpecificStoreScreen({ route, navigation }) {
  const { storeId } = route.params || {};
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!storeId) return;
        const s = await apiService.getStore(storeId).catch(() => null);
        const p = await apiService.getProductsByStore(storeId).catch(() => []);
        if (mounted) {
          setStore(s);
          setProducts(p || []);
        }
      } catch (err) {
        console.warn('Failed to load store data:', err.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [storeId]);

  const missions = [
    { id: 1, title: 'Large Shawarma: Buy 3, Get 1 Free', reward: 'Mission reward' },
    { id: 2, title: 'Earn P50 discount voucher by purchasing 5 meals', reward: 'P50 voucher' },
  ];

  const rewards = [
    { id: 1, title: 'Free 1 Regular Drink', points: 50 },
    { id: 2, title: 'Free Add ons', points: 30 },
    { id: 3, title: '1 Large Shawarma', points: 150 },
  ];

  if (loading) {
    return (
      <View style={[styles.screen, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Stores')}>
          <FontAwesome name="chevron-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{store?.name || 'Store'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Available Points card */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsTitle}>Available Points</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>115 points</Text>
            <TouchableOpacity style={styles.pointsButton}>
              <Text style={styles.pointsButtonText}>Use points</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu */}
        <Text style={styles.sectionHeading}>Menu</Text>
        <FlatList
          horizontal
          data={products}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuList}
          renderItem={({ item }) => (
            <View style={styles.menuCard}>
              <Image
                source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
                style={styles.menuImage}
              />
              <Text style={styles.menuLabel}>{item.name || item.title}</Text>
            </View>
          )}
        />

        {/* Explore Missions */}
        <Text style={styles.sectionHeading}>Explore Missions</Text>
        {missions.map((m) => (
          <View key={m.id} style={styles.missionRow}>
            <View style={styles.missionTextWrap}>
              <Text style={styles.missionTitle}>{m.title}</Text>
            </View>
            <TouchableOpacity style={styles.missionButton}>
              <Text style={styles.missionButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Redeemable Rewards */}
        <Text style={styles.sectionHeading}>Redeemable Rewards</Text>
        {rewards.map((r) => (
          <View key={r.id} style={styles.rewardRow}>
            <View>
              <Text style={styles.rewardTitle}>{r.title}</Text>
            </View>
            <View style={styles.rewardActions}>
              <TouchableOpacity style={styles.rewardRedeem}>
                <Text style={styles.rewardRedeemText}>Redeem</Text>
              </TouchableOpacity>
              <Text style={styles.rewardPoints}>{r.points} points</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerRight: { width: 20 },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  pointsCard: {
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  pointsTitle: { fontSize: Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xs },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsValue: { fontSize: Typography.h2, fontWeight: '700' },
  pointsButton: {
    backgroundColor: '#b71c1c',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  pointsButtonText: { color: '#fff' },
  sectionHeading: {
    fontSize: Typography.h3,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  menuList: { paddingBottom: Spacing.md },
  menuCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    padding: 10,
    marginRight: Spacing.md,
    alignItems: 'center',
    ...Shadows.light,
  },
  menuImage: { width: 80, height: 80, borderRadius: Radii.md, marginBottom: Spacing.sm },
  menuLabel: { fontSize: Typography.small, textAlign: 'center' },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
    ...Shadows.light,
  },
  missionTextWrap: { flex: 1, paddingRight: Spacing.sm },
  missionTitle: { fontSize: Typography.body },
  missionButton: {
    backgroundColor: '#b71c1c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
  },
  missionButtonText: { color: '#fff' },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
    ...Shadows.light,
  },
  rewardTitle: { fontSize: Typography.body },
  rewardActions: { flexDirection: 'row', alignItems: 'center' },
  rewardRedeem: {
    backgroundColor: '#b71c1c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    marginRight: Spacing.sm,
  },
  rewardRedeemText: { color: '#fff' },
  rewardPoints: { color: Colors.textSecondary },
});
