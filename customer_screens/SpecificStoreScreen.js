import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,
  ActivityIndicator,TouchableOpacity,
  Image, ScrollView, FlatList, Alert, Platform,
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

  console.log('=== COMPONENT INITIALIZED ===');
  console.log('Route params:', route.params);
  console.log('Store ID from params:', storeId);
  console.log('Store Name from params:', storeName);

  useEffect(() => {
    if (!storeId) {
      console.warn('No storeId provided, cannot load store data');
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        console.log('=== LOADING STORE DATA ===');
        console.log('Store ID:', storeId);
        console.log('Store Name:', storeName);
        
        // Test network connectivity first
        console.log('=== TESTING NETWORK CONNECTIVITY ===');
        try {
          const healthUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000/health' : 'http://localhost:3000/health';
          console.log('Testing health endpoint:', healthUrl);
          const healthResponse = await fetch(healthUrl);
          const healthText = await healthResponse.text();
          console.log('✅ Health check successful:', healthText);
        } catch (healthError) {
          console.error('❌ Health check failed:', healthError.message);
          console.error('This indicates the app cannot reach the server');
        }
        
        // Try multiple store endpoints (some codebases use getStoreBy)
        let s = null;
        if (typeof apiService.getStore === 'function') {
          s = await apiService.getStore(storeId).catch(() => null);
        }
        if (!s && typeof apiService.getStoreBy === 'function') {
          s = await apiService.getStoreBy(storeId).catch(() => null);
        }

        console.log('=== FETCHING PRODUCTS ===');
        console.log('Calling apiService.getProductsByStore with storeId:', storeId);
        console.log('API Base URL:', Platform.OS === 'android' ? 'http://192.168.1.10:3000/api' : 'http://localhost:3000/api');
        
        let p;
        try {
          p = await apiService.getProductsByStore(storeId);
          console.log('✅ Products API response:', p);
          console.log('Products type:', typeof p);
          console.log('Products array length:', Array.isArray(p) ? p.length : 'Not an array');
          if (Array.isArray(p) && p.length > 0) {
            console.log('First product:', p[0]);
          }
        } catch (error) {
          console.error('❌ Products API error:', error);
          console.error('Error message:', error.message);
          console.error('Error endpoint:', error.endpoint);
          p = [];
        }
        
        // Debug: Log the products data
        console.log('=== PROCESSING PRODUCTS DATA ===');
        console.log('Raw products data:', p);
        console.log('Products array length:', p ? p.length : 0);
        
        // Use actual products from API (no mock data)
        const productsToUse = p || [];
        if (productsToUse.length === 0) {
          console.log('⚠️ No products found for this store');
        } else {
          console.log('✅ Using API products:', productsToUse.length, 'items');
          if (productsToUse.length > 0) {
            console.log('Sample product fields:', Object.keys(productsToUse[0]));
          }
        }
        
        // Fetch rewards for this store
        const r = await apiService.getRewardsByStore ? apiService.getRewardsByStore(storeId).catch(() => []) : [];

        // Enhanced points fetching for this specific store
        let points = 0;
        try {
          console.log('=== FETCHING USER POINTS FOR STORE ===');
          
          // Get user ID from AsyncStorage (same way as HomePageScreen and MyPointsScreen)
          const userString = await AsyncStorage.getItem('@app_user');
          const user = userString ? JSON.parse(userString) : null;
          const userId = user?.user_id;
          
          console.log('User string from @app_user:', !!userString);
          console.log('Parsed user:', user);
          console.log('Extracted user ID:', userId);
          
          if (userId) {
            // Try getUserPointsByStore API (same as working screens)
            try {
              console.log(`Calling getUserPointsByStore for user ${userId}`);
              const pointsByStore = await apiService.getUserPointsByStore(userId);
              console.log('getUserPointsByStore response:', pointsByStore);
              
              if (pointsByStore && Array.isArray(pointsByStore)) {
                // Find points for this specific store
                const storePoints = pointsByStore.find(sp => 
                  String(sp.store_id) === String(storeId)
                );
                console.log('Found store points:', storePoints);
                
                if (storePoints) {
                  points = Number(storePoints.available_points || 0);
                  console.log('Extracted points for this store:', points);
                }
              }
            } catch (pointsErr) {
              console.warn('getUserPointsByStore failed:', pointsErr.message);
            }
          } else {
            console.log('No user found in @app_user storage');
          }
          
          console.log('Final points value:', points);
        } catch (e) {
          console.warn('Failed to fetch user points:', e.message);
          points = 0;
        }

        if (mounted) {
          console.log('=== SETTING STATE ===');
          console.log('Final products to set in state:', productsToUse);
          console.log('Products count:', productsToUse ? productsToUse.length : 0);
          
          setStore(s);
          setProducts(productsToUse || []);
          setRewards(r || []);
          setUserPoints(points);
          
          console.log('✅ State updated successfully');
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
          <View style={styles.pointsRow}>
            <Text style={styles.pointsTitle}>Available Points</Text>
            <Text style={styles.pointsValue}>{userPoints !== null ? `${userPoints} points` : 'Loading...'}</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <View style={styles.menuHeader}>
            <Text style={styles.sectionHeading}>Menu</Text>
            {products.length > 4 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('AllProducts', { 
                  storeId: storeId, 
                  storeName: storeName,
                  products: products 
                })}
              >
                <View style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <FontAwesome name="chevron-right" size={12} color="#000" style={styles.viewAllArrow} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          {products.length === 0 && !loading && (
            <View style={styles.noProductsContainer}>
              <FontAwesome name="cutlery" size={48} color="#c0c0c0" style={styles.noProductsIcon} />
              <Text style={styles.noProductsText}>No menu items available</Text>
              <Text style={styles.noProductsSubtext}>This store hasn't added any products yet.</Text>
            </View>
          )}
          {products.length > 0 && (
            <FlatList
              data={products.slice(0, 4)} // Show only first 4 items in 2x2 grid
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.menuRow}
              renderItem={({ item }) => (
                <View style={styles.menuCard}>
                  <View style={styles.menuImageWrap}>
                    <Image
                      source={{ uri: item.product_image || item.image_url || item.imageUrl || 'https://via.placeholder.com/150/c0c0c0' }}
                      style={styles.menuImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.menuLabelWrap}>
                    <Text 
                      style={styles.menuLabel}
                      numberOfLines={2}
                      ellipsizeMode='tail'
                    >
                      {item.product_name || item.name || item.title || 'product_name'}
                    </Text>
                    <Text style={styles.menuPoints}>
                      {item.price ? (() => {
                        let points = Math.round(item.price / 0.6);
                        let lastDigit = points % 10;
                        if (lastDigit !== 0 && lastDigit !== 5) {
                          if (lastDigit < 5) {
                            points = points - lastDigit + 5;
                          } else {
                            points = points + (10 - lastDigit);
                          }
                        }
                        return `${points} points`;
                      })() : 'points_value'}
                    </Text>
                    <TouchableOpacity style={styles.buyButton}>
                      <Text style={styles.buyButtonText}>Buy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

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
  pointsValue: { fontSize: Typography.h3, fontWeight: '600' },
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
  menuSection: {
    marginBottom: Spacing.lg,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: Typography.h6,
    color: '#000000ff',
    fontWeight: '450',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllArrow: {
    marginLeft: 6,
  },
  menuRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  menuCard: {
    width: '47%',
    height: 220,
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.light,
  },
  menuImageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#c0c0c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuImage: { 
    width: '100%', 
    height: '100%',
  },
  menuLabelWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLabel: { 
    fontSize: Typography.small, 
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  menuPoints: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  buyButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  debugInfo: {
    backgroundColor: '#ffffcc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ffcc00',
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  noProductsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    ...Shadows.light,
  },
  noProductsIcon: {
    marginBottom: 16,
  },
  noProductsText: {
    fontSize: Typography.body,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  noProductsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: Typography.small,
    fontWeight: '500',
  },
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
