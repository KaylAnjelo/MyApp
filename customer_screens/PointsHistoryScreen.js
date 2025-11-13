import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Typography, Spacing, Radii, Shadows } from "../styles/theme";
import apiService from "../services/apiService";

const PointsHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Get user ID from AsyncStorage
        const userStr = await AsyncStorage.getItem("@app_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const currentUserId = user.user_id;
          setUserId(currentUserId);

          // Fetch user transactions
          const data = await apiService.getUserTransactions(
            currentUserId,
            "customer"
          );
          
          // Filter only transactions with points (earned points)
          const pointTransactions = data.transactions?.filter(
            (t) => t.points > 0 && t.transaction_type === "Purchase"
          ) || [];
          
          // Group by reference_number to match other screens
          const grouped = {};
          pointTransactions.forEach(txn => {
            const refNum = txn.reference_number;
            if (!grouped[refNum]) {
              grouped[refNum] = {
                id: refNum,
                reference_number: refNum,
                stores: txn.stores,
                transaction_date: txn.transaction_date,
                total: 0,
                points: 0,
                transaction_type: txn.transaction_type
              };
            }
            
            // Sum up totals and points for this reference
            const itemTotal = txn.total != null ? parseFloat(txn.total) : (parseFloat(txn.price || 0) * parseFloat(txn.quantity || 0));
            grouped[refNum].total += isNaN(itemTotal) ? 0 : itemTotal;
            grouped[refNum].points += parseFloat(txn.points || 0);
          });

          setTransactions(Object.values(grouped));
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome
              name="history"
              size={64}
              color={Colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No points history yet</Text>
            <Text style={styles.emptySubText}>
              Start earning points by making purchases at your favorite stores!
            </Text>
          </View>
        ) : (
          transactions.map((transaction, index) => (
            <TouchableOpacity
              key={transaction.id || index}
              style={styles.transactionCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('TransactionDetails', {
                  referenceNumber: transaction.reference_number,
                  initial: {
                    store: transaction.stores?.store_name || "Unknown Store",
                    reference_number: transaction.reference_number,
                    date: formatDate(transaction.transaction_date),
                    amount: `₱${parseFloat(transaction.total || 0).toFixed(2)}`,
                    pointsEarned: `+${transaction.points || 0} pts`,
                    type: transaction.transaction_type || "Purchase",
                    items: []
                  },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>
                    {transaction.stores?.store_name || "Unknown Store"}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatDate(transaction.transaction_date)}
                  </Text>
                </View>
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsText}>
                    +{transaction.points || 0}
                  </Text>
                  <Text style={styles.pointsLabel}>points</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <FontAwesome
                    name="clock-o"
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {formatTime(transaction.transaction_date)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome
                    name="tag"
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {transaction.reference_number || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome
                    name="money"
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    ₱{parseFloat(transaction.total || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default PointsHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.quad,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.quad * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.quad * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: Typography.h3,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  transactionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.light,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: Typography.h3,
    fontWeight: "bold",
    color: Colors.primary,
  },
  pointsLabel: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  cardDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
});
