import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Colors, Typography, Spacing, Radii } from "../styles/theme";

const MyPointsScreen = ({ navigation }) => {
  const [highestPoints, setHighestPoints] = useState(0);
  const [storeImage, setStoreImage] = useState(null); // Store profile image from DB

  // Simulate fetching from DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Example: replace this with your actual API/db call
        // const response = await fetch("https://your-api.com/store");
        // const data = await response.json();
        // setHighestPoints(data.highestPoints);
        // setStoreImage(data.storeImage); // image should be a URL

        // Temporary mock values
        setHighestPoints(115);
        setStoreImage("https://via.placeholder.com/80"); // placeholder image
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
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
        {storeImage ? (
          <Image source={{ uri: storeImage }} style={styles.storeImage} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
        <Text style={styles.subText}>Highest available points</Text>
        <Text style={styles.pointsText}>{highestPoints} points</Text>
      </View>

    </View>
  );
};

export default MyPointsScreen;

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
  topSection: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.quad,
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
    marginBottom: Spacing.xs,
  },
  pointsText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "bold",
  },
});
