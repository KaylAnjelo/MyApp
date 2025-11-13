import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,
  ActivityIndicator,TouchableOpacity,
  Image, ScrollView, FlatList, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SpecificStoreScreen({ route, navigation }) {
  const { storeId, storeName } = route.params || {};
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(null);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!storeId) return;
        // Try multiple store endpoints (some codebases use getStoreBy)
        let s = null;
        if (typeof apiService.getStore === 'function') {
          s = await apiService.getStore(storeId).catch(() => null);
        }
        if (!s && typeof apiService.getStoreBy === 'function') {
          s = await apiService.getStoreBy(storeId).catch(() => null);
        }

        const p = await apiService.getProductsByStore(storeId).catch(() => []);
        
        // Fetch rewards for this store
        const r = await apiService.getRewardsByStore ? apiService.getRewardsByStore(storeId).catch(() => []) : [];

        // Enhanced points fetching for this specific store
        let points = 0;
        try {
          // Get current user ID from storage
          const userId = await AsyncStorage.getItem('@user_id');
          if (userId) {
            // Try getUserPointsByStore API first (most direct method)
            if (apiService.getUserPointsByStore) {
              try {
                const userStorePoints = await apiService.getUserPointsByStore(userId);
                if (userStorePoints && Array.isArray(userStorePoints)) {
                  const storePoints = userStorePoints.find(sp => 
                    String(sp.store_id || sp.storeId || sp.id) === String(storeId)
                  );
                  if (storePoints) {
                    points = Number(storePoints.points || storePoints.total_points || storePoints.customerPoints || 0);
                  }
                } else if (userStorePoints && typeof userStorePoints === 'object') {
                  // Single store response
                  points = Number(userStorePoints.points || userStorePoints.total_points || 0);
                }
              } catch (pointsErr) {
                console.warn('getUserPointsByStore failed:', pointsErr.message);
              }
            }
            
            // Fallback: try getStores endpoint to get user points per store
            if (points === 0) {
              try {
                const allStores = await apiService.getStores();
                const matched = (allStores || []).find((st) => {
                  const sid = st && (st.id || st.store_id || st.storeId || st.store);
                  return String(sid) === String(storeId);
                });
                if (matched) {
                  points = Number(matched.customerPoints || matched.customer_points || matched.points || matched.total_points || 0);
                }
              } catch (storeErr) {
                console.warn('Fallback store points fetch failed:', storeErr.message);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch user points:', e.message);
          points = 0;
        }

        if (mounted) {
          setStore(s);
          setProducts(p || []);
          setRewards(r || []);
          setUserPoints(points);
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

  // userPoints and rewards will be loaded from API (null while loading)

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
        <TouchableOpacity onPress={() => navigation.navigate('Stores')} accessibilityLabel="Back">
          <FontAwesome name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
  <Text style={styles.headerTitle}>{storeName || store?.name || 'Store'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Available Points card */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsTitle}>Available Points</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsValue}>{userPoints !== null ? `${userPoints} points` : '0 points'}</Text>
            <TouchableOpacity style={styles.pointsButton} onPress={() => Alert.alert('Use points', 'Open points modal')}>
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
              <View style={styles.menuImageWrap}>
                <Image
                  source={{ uri: item.product_image || 'https://via.placeholder.com/150/FFD54F' }}
                  style={styles.menuImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.menuLabelWrap}>
                <Text style={styles.menuLabel}>{item.product_name || item.title}</Text>
              </View>
            </View>
          )}
        />

        {/* Redeemable Rewards */}
        <Text style={styles.sectionHeading}>Redeemable Rewards</Text>
        {rewards.length === 0 ? (
          <View style={styles.emptyRewards}>
            <Text style={styles.emptyRewardsText}>No rewards available for this store</Text>
          </View>
        ) : (
          rewards.map((r) => {
            const isRedeemed = !!r.isRedeemed || !!r.is_redeemed || !!r.redeemed;
            const rewardPoints = r.points || r.required_points || r.point_cost || 0;
            const canRedeem = rewardPoints <= (userPoints ?? 0) && !isRedeemed;
            return (
              <View key={r.id} style={styles.rewardRow}>
                <View style={styles.rewardLeft}>
                  <Ionicons name="gift-outline" size={18} color={isRedeemed ? '#9e9e9e' : Colors.textPrimary} />
                  <Text style={styles.rewardTitle}>{r.title || r.name || r.description}</Text>
                </View>
                <View style={styles.rewardActions}>
                  {isRedeemed ? (
                    <View style={styles.redeemedPill}>
                      <Text style={styles.redeemedText}>Redeemed</Text>
                    </View>
                  ) : canRedeem ? (
                    <TouchableOpacity
                      style={styles.rewardRedeem}
                      onPress={() => Alert.alert('Redeem', `Redeeming: ${r.title || r.name}`)}
                    >
                      <Text style={styles.rewardRedeemText}>Redeem</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.pointsPill}>
                      <Text style={styles.pointsPillText}>{rewardPoints} points</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: '#fff',
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
    width: 140,
    backgroundColor: 'transparent',
    borderRadius: Radii.md,
    marginRight: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.light,
  },
  menuImageWrap: {
    width: 140,
    height: 100,
    backgroundColor: '#FFD54F',
    borderTopLeftRadius: Radii.md,
    borderTopRightRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuImage: { width: 110, height: 78, borderRadius: Radii.sm },
  menuLabelWrap: {
    width: 140,
    backgroundColor: '#fff',
    borderBottomLeftRadius: Radii.md,
    borderBottomRightRadius: Radii.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  menuLabel: { fontSize: Typography.small, textAlign: 'center' },
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
  rewardLeft: { flexDirection: 'row', alignItems: 'center' },
  rewardTitle: { fontSize: Typography.body, marginLeft: Spacing.sm },
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
  redeemedPill: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    marginRight: Spacing.sm,
  },
  redeemedText: { color: '#9e9e9e' },
  pointsPill: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    marginRight: Spacing.sm,
  },
  pointsPillText: { color: '#757575' },
  emptyRewards: {
    backgroundColor: '#fff',
    padding: Spacing.lg,
    borderRadius: Radii.md,
    alignItems: 'center',
    ...Shadows.light,
  },
  emptyRewardsText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
