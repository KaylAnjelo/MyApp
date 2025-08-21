import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Colors, Typography, Spacing, Radii } from "../styles/theme";

export default function FoodChasePage({ navigation }) {
  return (
    <View style={styles.container}>
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
        {/* missions content here */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
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
    padding: Spacing.xl,
  },
});
