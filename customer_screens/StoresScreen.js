import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function StoresScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const storesData = await apiService.getStores();
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStores();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Spacer to keep title centered (no back button on Stores screen) */}
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Stores</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Stores Grid */}
        <View style={styles.storesGrid}>
          {stores.length > 0 ? (
            stores.map((store, idx) => (
              <TouchableOpacity
                key={store && store.id ? String(store.id) : `store-${idx}`}
                style={styles.storeCard}
                onPress={() =>
                  navigation.navigate('SpecificStore', { storeId: store.id, storeName: store.name })
                }
              >
                <View style={styles.storeImageContainer}>
                  <Image
                    source={{
                      // prefer logoUrl if available, otherwise fall back to store_image
                      uri: store.logoUrl || store.store_image || 'https://via.placeholder.com/150',
                    }}
                    style={styles.storeImage}
                  />
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name || 'Store'}</Text>
                  <Text style={styles.storeAddress}>
                    {store.address || 'Address not available'}
                  </Text>
                  <View style={styles.storeRating}>
                    <FontAwesome name="star" size={12} color="#FFD700" />
                    <Text style={styles.storeRatingText}>
                      {store.rating || '5.0'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome
                name="store"
                size={50}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>No stores available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new stores
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('HomePage')}>
          <FontAwesome name="home" size={20} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation.navigate('Stores')}>
          <Ionicons name="storefront-outline" size={22} color={Colors.primary} />
          <Text style={[styles.navText, { color: Colors.primary }]}>Stores</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 20,
  },
  storesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    width: '48%',
    ...Shadows.medium,
  },
  storeImageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  storeImage: {
    width: '100%',
    height: 120,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
  },
  
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: Typography.body,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  storeAddress: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeRatingText: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.h3,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
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
