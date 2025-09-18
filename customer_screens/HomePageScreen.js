import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function HomePageScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storesData, productsData] = await Promise.all([
        apiService.getStores(),
        apiService.getProducts()
      ]);
      
      setStores(storesData);
      setProducts(productsData);
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
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logo_maroon.png')}
            style={styles.logoImage}/>
          <Ionicons name="notifications-outline" size={26} color="#7D0006" />
        </View>

        {/* Feature Cards Section */}
        <View style={styles.cardContainer}>
          {/* Big Left Card (Highest Available Points) */}
          <TouchableOpacity
            style={styles.bigCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("MyPoints")}
          >
            <Text style={styles.cardTitle}>Highest Available Points</Text>
            <View style={styles.cardContent}>
              <Image
                source={require('../assets/reward_points.png')}
                style={styles.rewardPointsImage}
                resizeMode="contain"
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.cardText}>Shawarma store</Text>
                <Text style={styles.cardPoints}>115 points</Text>
              </View>
            </View>

            {/* Use now button */}
            <TouchableOpacity
              style={styles.useNowButton}
              onPress={() => navigation.navigate("MyPoints")}
            >
              <Text style={styles.useNowText}>Use now</Text>
            </TouchableOpacity>
          </TouchableOpacity>

         {/* Right Two Small Cards */}
<View style={styles.cardRightContainer}>
  {/* Food Chase Card */}
  <TouchableOpacity
    style={styles.smallCard}
    activeOpacity={0.9}
    onPress={() => navigation.navigate("FoodChase")}
  >
    <Text style={styles.cardTitle}>Food Chase</Text>
    <Text style={styles.cardSubtitle}>Explore Missions</Text>
    <FontAwesome name="cutlery" size={26} color="#fff" style={styles.smallCardIcon} />
  </TouchableOpacity>

  {/* My Rewards Card */}
  <TouchableOpacity
    style={[styles.smallCard, { marginBottom: 0 }]}
    activeOpacity={0.9}
    onPress={() => navigation.navigate("MyRewards")}
  >
    <Text style={styles.cardTitle}>My Rewards</Text>
    <FontAwesome name="gift" size={26} color="#fff" style={styles.smallCardIcon} />
  </TouchableOpacity>
</View>
        </View>


        {/* Popular Stores Section */}
        <Text style={styles.sectionTitle}>Popular Stores</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {stores.length > 0 ? (
            stores.map((store) => (
              <TouchableOpacity 
                key={store.id} 
                style={styles.storeCard}
                onPress={() => navigation.navigate('SpecificStore', { storeId: store.id })}
              >
                <View style={styles.storeImagePlaceholder}>
                  <Image 
                    source={{ uri: store.image_url || 'https://via.placeholder.com/80' }} 
                    style={styles.storeImage} 
                  />
                  <FontAwesome name="heart" size={18} color="#7D0006" style={styles.favoriteIcon} />
                </View>
                <Text style={styles.storeName}>{store.name || 'Store'}</Text>
                <View style={styles.storeRating}>
                  <FontAwesome name="star" size={12} color="#FFD700" />
                  <Text style={styles.storeRatingText}>{store.rating || '5.0'}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No stores available</Text>
            </View>
          )}
        </ScrollView>

        {/* Recent Activities Section */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.recentActivitiesCard}>
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>
            No recent activities yet
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <FontAwesome name="home" size={20} color="#7D0006" />
          <Text style={[styles.navText, { color: '#7D0006' }]}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="storefront-outline" size={22} color="#555" />
          <Text style={styles.navText}>Stores</Text>
        </View>
        <View style={styles.navItem}>
          <FontAwesome name="qrcode" size={20} color="#555" />
          <Text style={styles.navText}>QR Scan</Text>
        </View>
        <View style={styles.navItem}>
          <FontAwesome name="list-alt" size={20} color="#555" />
          <Text style={styles.navText}>Activity</Text>
        </View>
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
  width: 150,
  height: 50,
  resizeMode: 'contain',
  marginLeft: -50,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bigCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    width: '60%',
    justifyContent: 'space-between',
    ...Shadows.light,
  },
  smallCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    height: '48%',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.light,
  },
  cardRightContainer: { width: '38%', justifyContent: 'space-between' },
  cardTitle: { fontSize: Typography.body, fontWeight: 'bold', color: Colors.white },
  cardSubtitle: { fontSize: Typography.small, color: '#f0f0f0', marginTop: Spacing.xs },
  cardContent: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  cardText: { color: Colors.white, fontSize: Typography.body },
  cardPoints: { color: Colors.white, fontSize: Typography.h2, fontWeight: 'bold' },

  useNowButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  useNowText: { color: Colors.primary, fontSize: Typography.small, fontWeight: '600' },

  sectionTitle: { fontSize: Typography.h3, fontWeight: '600', marginVertical: Spacing.md, color: Colors.textPrimary },
  horizontalScroll: { flexDirection: 'row' },
  storeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginRight: Spacing.lg,
    alignItems: 'center',
    marginVertical: 12,
  },
  cardText: {
    color: '#fff',
    fontSize: 13,
  },
  cardPoints: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  useNowText: {
    color: '#fff',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#000',
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    alignItems: 'center', // Centers children horizontally
    width: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  storeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  storeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  storeLogoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 3,
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  storeRatingText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 5,
  },
  recentActivitiesCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    height: 150,
    marginTop: 10,
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
  rewardPointsImage: {
    width: 20,
    height: 20,
  },
  smallCardIcon: {
    position: 'absolute',
    right: 15,
    bottom: 15,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
});