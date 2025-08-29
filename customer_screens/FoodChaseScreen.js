import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Colors, Typography, Spacing, Radii } from "../styles/theme";

export default function FoodChasePage({ navigation }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // TODO: Replace with real database/API call to fetch recent transactions
    // Example:
    // fetchRecentTransactions(userId).then(setTransactions).catch(console.error);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pageContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Chase</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Top Section */}
      <View style={styles.topSection}>
        <Image
          source={require("../assets/foodchase_bg.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.description}>
          Earn points with every visit, reach milestones, and enjoy discounts,
          freebies, and special perks.
        </Text>
      </View>

      {/* White Content Area */}
      <View style={styles.whiteBox}>
        <View style={styles.whiteContent}>
        {/* Explore Missions */}
        <Text style={styles.sectionTitle}>Explore Missions</Text>
        <View style={styles.missionsRow}>
          <View style={styles.missionCard}>
            <Image source={{ uri: 'https://via.placeholder.com/80/cccccc/cccccc' }} style={styles.missionLogo} />
            <TouchableOpacity style={styles.missionGoButton}>
              <Text style={styles.missionGoText}>Go</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.missionCard}>
            <Image source={{ uri: 'https://via.placeholder.com/80/cccccc/cccccc' }} style={styles.missionLogo} />
            <TouchableOpacity style={styles.missionGoButton}>
              <Text style={styles.missionGoText}>Go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All ›</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}> 
            <Text style={styles.emptyTitle}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map((txn, idx) => (
            <View key={idx} style={styles.transactionRow}>
              <Image source={{ uri: txn.logoUrl }} style={styles.txnLogoCircle} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txnTitle}>{txn.storeName}</Text>
                <Text style={styles.txnDate}>{txn.dateLabel}</Text>
              </View>
              <Text style={styles.txnAmount}>{txn.amountLabel}</Text>
            </View>
          ))
        )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  pageContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.quad,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: "700",
  },
  topSection: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.quad,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
  },
  image: {
    width: 180,
    height: 180,
    marginTop: -(Spacing.quad + Spacing.lg),
  },
  description: {
    color: Colors.white,
    fontSize: Typography.body,
    textAlign: "left",
    lineHeight: 20,
  },
  whiteBox: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: -20,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  whiteContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.quad * 2,
  },
  sectionTitle: {
    fontSize: Typography.h3,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  missionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.quad,
  },
  missionCard: {
    backgroundColor: Colors.white,
    width: '48%',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  missionLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  missionLogoImg: { width: 80, height: 80, borderRadius: 40 },
  missionGoButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.quad,
    borderRadius: Radii.sm,
  },
  missionGoText: { color: Colors.white, fontWeight: '700' },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.quad,
    marginBottom: Spacing.lg,
  },
  viewAll: { color: Colors.textSecondary },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  txnLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  txnLogoImg: { width: 56, height: 56, borderRadius: 28 },
  txnTitle: { fontWeight: '700', color: Colors.textPrimary },
  txnDate: { color: Colors.textSecondary, marginTop: Spacing.xs },
  txnAmount: { fontWeight: '700', color: Colors.textPrimary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.quad,
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.h4,
    color: Colors.textSecondary,
  },
});
