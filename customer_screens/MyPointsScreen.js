import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Colors, Typography, Spacing, Radii, Shadows } from "../styles/theme";
import apiService from "../services/apiService";

const MyPointsScreen = ({ navigation }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await apiService.getStores();
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Calculate the highest points available from all stores
  const highestPoints = stores.reduce(
    (max, store) => Math.max(max, store.customerPoints || 0), // Use 0 if customerPoints is undefined
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
                stores.map((store) => {
                  const canClaim = store.customerPoints >= store.claimThreshold;
                  return (
                    <View key={store.id} style={styles.storeCard}>
                      <View style={styles.logoCircle}>
                        <Image source={{ uri: store.logoUrl }} style={styles.logoImage} />
                      </View>
                      <View style={styles.cardInfo}>
                        {/* 🌟 FIX/ENHANCEMENT: Use optional chaining and fallback text */}
                        <Text style={styles.storeName}>
                          {store.name || "Store Name Missing"} 
                        </Text>
                        <Text style={styles.storePoints}>
                          <Text style={{ fontWeight: "700" }}>{store.customerPoints} points</Text>
                        </Text>
                        {!canClaim && (
                          <Text style={styles.storeNote}>Insufficient points.</Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={[styles.cardButton, canClaim ? styles.useButton : styles.collectButton]} 
                        activeOpacity={0.9}
                      >
                        <Text style={[styles.cardButtonText, canClaim ? { color: Colors.white } : null]}>
                          {canClaim ? "Use points" : "Collect points"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            {/* Points History CTA */}
            <TouchableOpacity style={styles.pointsHistoryButton} activeOpacity={0.9}>
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
  // ... (Your existing styles are here)
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