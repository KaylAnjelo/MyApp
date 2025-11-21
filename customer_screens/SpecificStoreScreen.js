import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,
  ActivityIndicator,TouchableOpacity,
  Image, ScrollView, FlatList, Alert, Platform, InteractionManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SpecificStoreScreen({ route, navigation }) {
  const { storeId, storeName } = route.params || {};
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [redeeming, setRedeeming] = useState(null); // Track which reward is being redeemed
  const [isMounted, setIsMounted] = useState(true);

  console.log('=== COMPONENT INITIALIZED ===');
  console.log('Route params:', route.params);
  console.log('Store ID from params:', storeId);
  console.log('Store Name from params:', storeName);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

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
          // Use the same base URL as apiService
          const baseUrl = Platform.OS === 'android' 
            ? 'http://localhost:3000'  // Physical device - change to 10.0.2.2 for emulator
            : 'http://localhost:3000';
          const healthUrl = `${baseUrl}/health`;
          console.log('Testing health endpoint:', healthUrl);
          const healthResponse = await fetch(healthUrl, { 
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });
          const healthText = await healthResponse.text();
          console.log('✅ Health check successful:', healthText);
        } catch (healthError) {
          console.error('❌ Health check failed:', healthError.message);
          console.error('This indicates the app cannot reach the server');
          console.error('Make sure server is running and device is on same network as server');
          // Continue anyway, the API calls might still work
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
        console.log('Fetching rewards for store:', storeId);
        let r = [];
        try {
          if (apiService.getRewardsByStore) {
            const response = await apiService.getRewardsByStore(storeId);
            console.log('Rewards API full response:', JSON.stringify(response, null, 2));
            // Extract data array from response object
            r = response?.data || response || [];
            console.log('Extracted rewards array:', r);
            console.log('Number of rewards:', r.length);
          }
        } catch (error) {
          console.error('Error fetching rewards:', error.message);
        }
        // Ensure r is always an array
        if (!Array.isArray(r)) {
          console.warn('Rewards is not an array, converting to empty array. Response was:', typeof r);
          r = [];
        }
        console.log('Final rewards array length:', r.length);
        if (r.length > 0) {
          console.log('Sample reward:', JSON.stringify(r[0], null, 2));
        }

        // Note: Redemptions are now tracked in transactions table
        // Users can redeem rewards multiple times if they have enough points

        // Fetch user's total points from user_points table
        let points = 0;
        try {
          console.log('=== FETCHING USER POINTS ===');
          
          // Get user ID from AsyncStorage
          const userString = await AsyncStorage.getItem('@app_user');
          const user = userString ? JSON.parse(userString) : null;
          const userId = user?.user_id;
          
          console.log('User ID:', userId);
          
          if (userId) {
            try {
              console.log('Calling getUserPoints for user:', userId, 'store:', storeId);
              const pointsData = await apiService.getUserPoints(userId, storeId);
              console.log('getUserPoints response:', pointsData);
              
              if (pointsData) {
                points = Number(pointsData.total_points || 0);
                console.log(`Total points for store ${storeId}:`, points);
              }
            } catch (pointsErr) {
              console.warn('getUserPoints failed:', pointsErr.message);
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

  const handleBuyProduct = async (product) => {
    try {
      console.log('=== STARTING PRODUCT REDEMPTION ===');
      console.log('Product:', product);
      console.log('Store state:', store);
      console.log('Store ID:', storeId);
      
      // Get user ID from AsyncStorage
      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;

      if (!userId) {
        console.log('❌ No user ID found');
        if (isMounted) {
          Alert.alert('Error', 'Please log in to redeem products');
        }
        return;
      }

      // Get owner_id - try from store state or fetch from API
      let ownerId = store?.owner_id;
      
      if (!ownerId) {
        console.log('⚠️ Owner ID not in store state, fetching from API...');
        try {
          // Fetch store data to get owner_id
          const storeData = await apiService.getStore(storeId);
          console.log('Fetched store data:', storeData);
          
          if (storeData && storeData.owner_id) {
            ownerId = storeData.owner_id;
            // Update store state with fetched data
            setStore(storeData);
            console.log('✓ Got owner_id from API:', ownerId);
          } else {
            console.log('❌ Could not get owner_id from API');
            if (isMounted) {
              Alert.alert('Error', 'Store information not available. Please try again.');
            }
            return;
          }
        } catch (err) {
          console.error('Error fetching store data:', err);
          if (isMounted) {
            Alert.alert('Error', 'Failed to load store information');
          }
          return;
        }
      } else {
        console.log('✓ Owner ID from store state:', ownerId);
      }

      // Calculate points required (price / 0.6 rounded to nearest 5)
      let pointsRequired = Math.round(product.price / 0.6);
      let lastDigit = pointsRequired % 10;
      if (lastDigit !== 0 && lastDigit !== 5) {
        if (lastDigit < 5) {
          pointsRequired = pointsRequired - lastDigit + 5;
        } else {
          pointsRequired = pointsRequired + (10 - lastDigit);
        }
      }

      // Check if user has enough points
      if (userPoints < pointsRequired) {
        Alert.alert(
          'Insufficient Points',
          `You need ${pointsRequired} points to redeem this product.\n\nYou currently have ${userPoints} points.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Process redemption directly without confirmation dialog
      try {
        console.log('Processing redemption with:', { userId, productId: product.id, storeId, ownerId, pointsRequired });
        
        // Call API to redeem product
        const response = await apiService.redeemProduct(
          userId,
          product.id,
          storeId,
          ownerId,
          pointsRequired
        );

        console.log('Redemption response:', response);

        // Update points in state
        if (response.remainingPoints !== undefined) {
          setUserPoints(response.remainingPoints);
        }

        console.log('✅ Product redeemed successfully!');
        console.log(`Points used: ${pointsRequired}, Remaining: ${response.remainingPoints}`);
      } catch (error) {
        console.error('Error processing redemption:', error);
        console.error('Error message:', error.message);
      }
    } catch (error) {
      console.error('Error in handleBuyProduct:', error);
      if (isMounted) {
        Alert.alert('Error', 'Failed to process redemption');
      }
    }
  };

  const handleRedeemReward = async (reward) => {
    try {
      setRedeeming(reward.id || reward.reward_id);
      
      console.log('=== STARTING REDEMPTION ===');
      console.log('Reward:', reward);
      console.log('Store state:', store);
      
      // Get user ID from AsyncStorage
      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;

      console.log('User ID:', userId);

      if (!userId) {
        if (isMounted) {
          Alert.alert('Error', 'Please log in to redeem rewards');
        }
        setRedeeming(null);
        return;
      }

      const rewardId = reward.id || reward.reward_id;
      const ownerId = store?.owner_id;

      console.log('Reward ID:', rewardId);
      console.log('Owner ID from store:', ownerId);

      if (!ownerId) {
        if (isMounted) {
          Alert.alert('Error', 'Store information not available. Please try refreshing the page.');
        }
        setRedeeming(null);
        return;
      }

      console.log('Making redemption request with:', { userId, rewardId, storeId, ownerId });

      const response = await apiService.redeemReward(userId, rewardId, storeId, ownerId);
      
      console.log('Redemption response:', response);

      // Update user points in state
      if (response.remainingPoints !== undefined) {
        setUserPoints(response.remainingPoints);
      }

      if (isMounted) {
        Alert.alert(
          'Success!',
          `You've redeemed: ${reward.reward_name || reward.title || reward.name}\n\nCheck "My Rewards" to use it at the store.`,
          [
            { text: 'View My Rewards', onPress: () => navigation.navigate('MyRewards') },
            { text: 'OK' }
          ]
        );
      }

      // Reload rewards to reflect the change
      const updatedRewards = await apiService.getRewardsByStore(storeId);
      const rewardsArray = updatedRewards?.data || updatedRewards || [];
      setRewards(Array.isArray(rewardsArray) ? rewardsArray : []);

    } catch (error) {
      console.error('Error redeeming reward:', error);
      if (isMounted) {
        Alert.alert('Error', error.message || 'Failed to redeem reward. Please try again.');
      }
    } finally {
      setRedeeming(null);
    }
  };

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
              <FontAwesome name="utensils" size={48} color="#c0c0c0" style={styles.noProductsIcon} solid />
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
                    {item.product_image || item.image_url || item.imageUrl ? (
                      <Image
                        source={{ uri: item.product_image || item.image_url || item.imageUrl }}
                        style={styles.menuImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <FontAwesome name="utensils" size={48} color="#bbb" solid />
                    )}
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
                    <TouchableOpacity 
                      style={styles.buyButton}
                      onPress={() => handleBuyProduct(item)}
                    >
                      <Text style={styles.buyButtonText}>Redeem</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Redeemable Rewards */}
        <Text style={styles.sectionHeading}>Deals & Rewards</Text>
        {!rewards || rewards.length === 0 ? (
          <View style={styles.emptyRewards}>
            <Text style={styles.emptyRewardsText}>No rewards available for this store</Text>
          </View>
        ) : (
          Array.isArray(rewards) && rewards.map((r, index) => {
            const isPromotion = r.type === 'promotion';
            const isReward = r.type === 'reward' || !r.type;
            
            // For promotions
            if (isPromotion) {
              const discountText = r.discount_type === 'percentage' 
                ? `${r.discount_value}% OFF`
                : `₱${r.discount_value} OFF`;
              
              return (
                <View key={r.id || r.promotion_id || `promo-${index}`} style={styles.rewardRow}>
                  <View style={styles.rewardLeft}>
                    <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
                    <View style={styles.rewardTextContainer}>
                      <Text style={styles.rewardTitle}>{r.name || r.description}</Text>
                      {r.description && r.name && (
                        <Text style={styles.rewardDescription}>{r.description}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.rewardActions}>
                    <View style={[styles.pointsPill, { backgroundColor: Colors.primary }]}>
                      <Text style={[styles.pointsPillText, { color: '#fff' }]}>{discountText}</Text>
                    </View>
                  </View>
                </View>
              );
            }
            
            // For rewards (point-based)
            const rewardId = r.id || r.reward_id;
            const rewardPoints = r.points_required || r.points || r.required_points || r.point_cost || 0;
            const canRedeem = rewardPoints <= (userPoints ?? 0);
            
            return (
              <View key={r.id || r.reward_id || `reward-${index}`} style={styles.rewardRow}>
                <View style={styles.rewardLeft}>
                  <Ionicons name="gift-outline" size={18} color={Colors.textPrimary} />
                  <View style={styles.rewardTextContainer}>
                    <Text style={styles.rewardTitle}>{r.reward_name || r.title || r.name || r.description}</Text>
                    {r.description && r.reward_name && (
                      <Text style={styles.rewardDescription}>{r.description}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.rewardActions}>
                  {canRedeem ? (
                    <TouchableOpacity
                      style={[styles.rewardRedeem, redeeming === (r.id || r.reward_id) && styles.rewardRedeemDisabled]}
                      onPress={() => handleRedeemReward(r)}
                      disabled={redeeming === (r.id || r.reward_id)}
                    >
                      {redeeming === (r.id || r.reward_id) ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.rewardRedeemText}>Redeem</Text>
                      )}
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
    backgroundColor: '#f4f4f4', // lighter background for placeholder
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
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  rewardLeft: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    flex: 1,
    marginRight: Spacing.md,
  },
  rewardTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  rewardTitle: { 
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  rewardActions: { flexDirection: 'row', alignItems: 'center' },
  rewardRedeem: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    ...Shadows.light,
    minWidth: 80,
    alignItems: 'center',
  },
  rewardRedeemDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  rewardRedeemText: { 
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.body,
  },
  rewardPoints: { color: Colors.textSecondary },
  redeemedPill: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  redeemedText: { 
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: Typography.small,
  },
  pointsPill: {
    backgroundColor: '#fff3e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  pointsPillText: { 
    color: '#e65100',
    fontWeight: '600',
    fontSize: Typography.small,
  },
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
