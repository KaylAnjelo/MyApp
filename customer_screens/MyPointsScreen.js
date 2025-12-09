import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from "../styles/theme";
import apiService from "../services/apiService";

const MyPointsScreen = ({ navigation }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user ID from AsyncStorage
        const userStr = await AsyncStorage.getItem('@app_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const currentUserId = user.user_id;
          setUserId(currentUserId);

          // Fetch stores first
          const storesData = await apiService.getStores();
          console.log('[MyPoints] Stores data fetched:', JSON.stringify(storesData, null, 2));

          // Fetch points for each store individually
          const storesWithPointsPromises = storesData.map(async (store) => {
            try {
              const storeId = store.store_id || store.id;
              console.log('[MyPoints] Fetching points for userId:', currentUserId, 'storeId:', storeId);
              const pointsData = await apiService.getUserPoints(currentUserId, storeId);
              console.log('[MyPoints] Points data received:', pointsData);
              const customerPoints = pointsData?.total_points || 0;
              console.log('[MyPoints] Customer points for store', storeId, ':', customerPoints);
              return {
                ...store,
                customerPoints: customerPoints,
                claimThreshold: store.claim_threshold || store.claimThreshold || 100 // Default threshold
              };
            } catch (err) {
              console.log('[MyPoints] Error fetching points for store', store.store_id || store.id, ':', err.message);
              // If no points record for this store, return 0
              return {
                ...store,
                customerPoints: 0,
                claimThreshold: store.claim_threshold || store.claimThreshold || 100
              };
            }
          });

          const storesWithPoints = await Promise.all(storesWithPointsPromises);
          console.log('[MyPoints] All stores with points:', JSON.stringify(storesWithPoints, null, 2));
          setStores(storesWithPoints);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate the highest points available from all stores
  const highestPoints = stores.reduce(
    (max, store) => Math.max(max, store.customerPoints || 0),
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.pageContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="chevron-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Points</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Add a placeholder image logic if needed */}
          <Text style={styles.subText}>Highest available points</Text>
          <Text style={styles.pointsText}>{loading ? '...' : `${highestPoints} points`}</Text>
        </View>

        {/* White Content Area */}
        <View style={styles.whiteBox}>
          <View style={styles.whiteBoxContent}>
            {/* Dynamic Store Cards */}
            <View style={styles.cardsContainer}>
              {loading ? (
                <Text style={styles.loadingText}>Loading stores...</Text>
              ) : stores.length === 0 ? (
                <Text style={styles.loadingText}>No stores found.</Text>
              ) : (
                stores.map((store, idx) => {
                  const canClaim = store.customerPoints >= store.claimThreshold;
                  return (
                    <View key={store && store.id ? String(store.id) : `store-${idx}`} style={styles.storeCard}>
                      <View style={styles.logoCircle}>
                        {store.logoUrl || store.store_image ? (
                          <Image 
                            source={{ uri: store.logoUrl || store.store_image }} 
                            style={styles.logoImage} 
                          />
                        ) : (
                          <FontAwesome name="store" size={36} color="#bbb" solid />
                        )}
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.storeName}>
                          {store.name || store.store_name || "Store Name Missing"} 
                        </Text>
                        <Text style={styles.storePoints}>
                          <Text style={{ fontWeight: "700" }}>{store.customerPoints || 0} points</Text>
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Points History CTA */}
            <TouchableOpacity 
              style={styles.pointsHistoryButton} 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PointsHistory')}
            >
              <Text style={styles.pointsHistoryText}>Points History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MyPointsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  pageContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.quad,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: "bold",
    marginLeft: Spacing.lg,
  },
  topSection: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.quad + 20,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ccc",
    marginBottom: Spacing.md,
  },
  subText: {
    color: Colors.white,
    fontSize: Typography.small,
    marginBottom: Spacing.md,
  },
  pointsText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "bold",
    marginBottom: Spacing.xl,
  },
  whiteBox: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: -40,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  whiteBoxContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.quad * 2,
    flexGrow: 1,
  },
  cardsContainer: {
    flexGrow: 1,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.light,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  storePoints: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  storeNote: {
    marginTop: Spacing.xs,
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  cardButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
  },
  useButton: {
    backgroundColor: Colors.primary,
  },
  collectButton: {
    backgroundColor: "#eee",
  },
  cardButtonText: {
    fontSize: Typography.small,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  pointsHistoryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.quad,
    alignSelf: "center",
    marginTop: Spacing.quad,
    marginBottom: Spacing.quad,
    width: "80%",
    alignItems: "center",
  },
  pointsHistoryText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: Typography.h3,
  },
  // New style for loading/no data text
  loadingText: {
    textAlign: 'center',
    marginTop: Spacing.quad,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
});