import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="chevron-left" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stores</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Stores Grid */}
        <View style={styles.storesGrid}>
          {stores.length > 0 ? (
            stores.map((store) => (
              <TouchableOpacity 
                key={store.id} 
                style={styles.storeCard}
                onPress={() => navigation.navigate('SpecificStore', { storeId: store.id })}
              >
                <View style={styles.storeImageContainer}>
                  <Image 
                    source={{ uri: store.image_url || 'https://via.placeholder.com/150' }} 
                    style={styles.storeImage} 
                  />
                  <FontAwesome name="heart" size={18} color="#7D0006" style={styles.favoriteIcon} />
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name || 'Store'}</Text>
                  <Text style={styles.storeAddress}>{store.address || 'Address not available'}</Text>
                  <View style={styles.storeRating}>
                    <FontAwesome name="star" size={12} color="#FFD700" />
                    <Text style={styles.storeRatingText}>{store.rating || '5.0'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="store" size={50} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No stores available</Text>
              <Text style={styles.emptySubtext}>Check back later for new stores</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  favoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
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
});
