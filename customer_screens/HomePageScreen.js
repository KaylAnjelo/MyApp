import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function HomePageScreen({ navigation }) {
  const [showBanner, setShowBanner] = useState(false);
  const bannerAnim = useRef(new Animated.Value(-60)).current; // for translateY
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const prevUnreadRef = useRef(0);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [highestPointsStore, setHighestPointsStore] = useState({
    storeName: 'No points yet',
    points: 0,
    storeImage: null,
    hasPoints: false,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isFocused) {
      fetchData();
      fetchNotifications();
    }
  }, [isFocused]);

  // Alert when new notification arrives
  useEffect(() => {
    console.log('Unread notifications:', unreadNotifications);
    if (unreadNotifications > prevUnreadRef.current) {
      setShowBanner(true);
      Animated.parallel([
        Animated.timing(bannerAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(bannerAnim, {
            toValue: -60,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bannerOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start(() => setShowBanner(false));
      }, 2000);
    }
    prevUnreadRef.current = unreadNotifications;
  }, [unreadNotifications]);

  // Fetch unread notifications count
  const fetchNotifications = async () => {
    try {
      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;
      if (!userId) return;
      const response = await apiService.getUserNotifications(userId);
      let unread = 0;
      if (Array.isArray(response)) {
        unread = response.filter(n => !n.is_read).length;
      } else if (response && response.notifications) {
        unread = response.notifications.filter(n => !n.is_read).length;
      }
      setUnreadNotifications(Number(unread));
      console.log('Fetched unread notifications:', unread);
    } catch (err) {
      setUnreadNotifications(0);
      console.log('Error fetching notifications:', err);
    }
  };

  const fetchData = async () => {
    try {
      // Get user ID from AsyncStorage
      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;

      const [storesData, productsData] = await Promise.all([
        apiService.getStores(),
        apiService.getProducts(),
      ]);
      setStores(storesData || []);
      setProducts(productsData || []);

      // Fetch highest points by store and recent activities if userId is available
      if (userId) {
        try {
          // Fetch transactions data
          const transactionsData = await apiService.getUserTransactions(userId, 'customer');
          
          // Fetch points for each store
          const storePointsPromises = storesData.map(async (store) => {
            try {
              const storeId = store.store_id || store.id;
              const pointsData = await apiService.getUserPoints(userId, storeId);
              return {
                store_id: storeId,
                store_name: store.store_name || store.name,
                available_points: pointsData?.total_points || 0,
                storeImage: store.store_image
              };
            } catch (err) {
              // If no points record for this store, return 0
              return {
                store_id: store.store_id || store.id,
                store_name: store.store_name || store.name,
                available_points: 0,
                storeImage: store.store_image
              };
            }
          });
          
          const pointsByStore = await Promise.all(storePointsPromises);
          
          // Handle points by store
          if (pointsByStore && pointsByStore.length > 0) {
            // Find the store with highest points
            const highest = pointsByStore.reduce((max, current) =>
              (current.available_points || 0) > (max.available_points || 0) ? current : max
            );
            
            if (highest.available_points > 0) {
              setHighestPointsStore({
                storeName: highest.store_name || 'Store',
                points: highest.available_points || 0,
                storeImage: highest.storeImage || null,
                hasPoints: true,
              });
            } else {
              // No points available at any store
              setHighestPointsStore({
                storeName: 'No points yet',
                points: 0,
                storeImage: null,
                hasPoints: false,
              });
            }
          } else {
            // No points available
            setHighestPointsStore({
              storeName: 'No points yet',
              points: 0,
              storeImage: null,
              hasPoints: false,
            });
          }
          
          // Handle recent activities
          if (transactionsData?.transactions) {
            // Group by reference_number and take most recent 5
            const grouped = {};
            transactionsData.transactions.forEach(txn => {
              const refNum = txn.reference_number;
              if (!grouped[refNum]) {
                grouped[refNum] = {
                  id: refNum,
                  reference_number: refNum,
                  store: txn.stores?.store_name || 'Unknown Store',
                  date: new Date(txn.transaction_date),
                  total: 0,
                  points: 0,
                  type: txn.transaction_type || 'Purchase'
                };
              }
              
              const itemTotal = txn.total != null ? parseFloat(txn.total) : (parseFloat(txn.price || 0) * parseFloat(txn.quantity || 0));
              grouped[refNum].total += isNaN(itemTotal) ? 0 : itemTotal;
              grouped[refNum].points += parseFloat(txn.points || 0);
            });
            
            // Sort by date (most recent first) and take top 5
            const recent = Object.values(grouped)
              .sort((a, b) => b.date - a.date)
              .slice(0, 5)
              .map(activity => ({
                ...activity,
                formattedDate: activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                amount: `₱${activity.total.toFixed(2)}`,
                pointsEarned: `+${activity.points} pts`
              }));
            
            setRecentActivities(recent);
          }
        } catch (error) {
          console.warn('Could not fetch user data:', error);
          // Set no points state if API call fails
          setHighestPointsStore({
            storeName: 'No points yet',
            points: 0,
            storeImage: null,
            hasPoints: false,
          });
          setRecentActivities([]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.banner,
          {
            transform: [{ translateY: bannerAnim }],
            opacity: bannerOpacity,
            display: showBanner ? 'flex' : 'none',
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.bannerText}>You have a new notification!</Text>
      </Animated.View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../assets/logo_maroon.png')} style={styles.logoImage} />
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={26} color={Colors.primary} />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Top cards: Highest Available Points + My Rewards */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.topCardLeft}
            activeOpacity={0.95}
            onPress={() => navigation.navigate('MyPoints')}
          >
            <Text style={styles.topCardTitle}>Highest Available Points</Text>
            {highestPointsStore.hasPoints ? (
              <View style={styles.topCardContent}>
                <Image source={require('../assets/reward_points.png')} style={styles.topCardImage} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.topCardText}>{highestPointsStore.storeName}</Text>
                  <Text style={styles.topCardPoints}>{highestPointsStore.points} points</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noPointsText}>Start earning by making a purchase.</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topCardRight}
            activeOpacity={0.95}
            onPress={() => navigation.navigate('MyRewards')}
          >
            <Text style={styles.topCardTitle}>My Rewards</Text>
            <FontAwesome name="gift" size={28} color="#fff" style={styles.topCardIcon} />
          </TouchableOpacity>
        </View>

        {/* Popular Stores */}
        <Text style={styles.sectionTitle}>Popular Stores</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {stores.length > 0 ? (
            stores.map((store, idx) => (
              <TouchableOpacity
                key={store && store.id ? String(store.id) : `store-${idx}`}
                style={styles.popularCard}
                onPress={() => navigation.navigate('SpecificStore', { storeId: store.id, storeName: store.name })}
              >
                <View style={[styles.popularImageArea, { backgroundColor: store.brandColor || '#7D0006' }]}> 
                  {/* centered store image */}
                  {store.store_image && (
                    <Image source={{ uri: store.store_image }} style={styles.popularLogo} />
                  )}
                </View>
                <View style={styles.popularInfo}>
                  <Text style={styles.popularName}>{store.name || 'Store'}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No stores available</Text>
            </View>
          )}
        </ScrollView>

        {/* Recent Activities */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.recentActivitiesCard}>
          {recentActivities.length === 0 ? (
            <Text style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>No recent activities yet</Text>
          ) : (
            recentActivities.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                onPress={() => navigation.navigate('TransactionDetails', {
                  referenceNumber: activity.reference_number,
                  initial: {
                    store: activity.store,
                    reference_number: activity.reference_number,
                    date: activity.formattedDate,
                    amount: activity.amount,
                    pointsEarned: activity.pointsEarned,
                    type: activity.type
                  }
                })}
              >
                <View style={styles.activityInfo}>
                  <Text style={styles.activityStore}>{activity.store}</Text>
                  <Text style={styles.activityDate}>{activity.formattedDate}</Text>
                </View>
                <View style={styles.activityAmount}>
                  <Text style={styles.activityTotal}>{activity.amount}</Text>
                  <Text style={styles.activityPoints}>{activity.pointsEarned}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('HomePage')}>
          <FontAwesome name="home" size={20} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary }]}>Home</Text>
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
          <FontAwesome name="list-alt" size={20} color="#555" />
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('ProfilePage')}>
          <FontAwesome name="user-o" size={20} color="#555" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  bannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  topCardLeft: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    width: '55%',
    height: 160,
    marginRight: Spacing.md,
    justifyContent: 'space-between',
    ...Shadows.light,
  },
  topCardRight: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    width: '40%',
    height: 160,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...Shadows.light,
  },
  topCardTitle: {
    color: Colors.white,
    fontSize: Typography.body,
    marginBottom: Spacing.md,
  },
  topCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  topCardImage: {
    width: 52,
    height: 52,
  },
  topCardText: {
    color: Colors.white,
    fontSize: Typography.small,
  },
  topCardPoints: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: '700',
  },
  noPointsText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontStyle: 'italic',
  },
  topCardButton: {
    marginTop: Spacing.sm,
    backgroundColor: '#7D0006',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    alignSelf: 'flex-start',
  },
  topCardButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  topCardIcon: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  sectionTitle: { fontSize: Typography.h3, fontWeight: '700', marginBottom: Spacing.md },
  horizontalScroll: { marginBottom: Spacing.lg },
  popularCard: {
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    marginRight: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  popularImageArea: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularLogo: { width: '100%', height: '100%', resizeMode: 'cover' },
  popularLogoPlaceholder: { color: '#fff' },
  popularInfo: { padding: Spacing.md, paddingTop: Spacing.sm },
  popularName: { fontSize: Typography.body, fontWeight: '700', marginBottom: Spacing.xs },
  collectButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#7D0006',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
  },
  collectButtonText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.h3, color: Colors.textSecondary, marginTop: Spacing.md },
  recentActivitiesCard: { 
    minHeight: 120, 
    backgroundColor: '#fff', 
    borderRadius: Radii.lg, 
    marginBottom: Spacing.lg, 
    padding: Spacing.md,
    ...Shadows.light 
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityInfo: {
    flex: 1,
  },
  activityStore: {
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityTotal: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activityPoints: {
    fontSize: Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  // bottom nav
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
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, marginTop: 2, color: '#555' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  loadingText: { marginTop: 10, fontSize: Typography.body, color: Colors.textSecondary },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});