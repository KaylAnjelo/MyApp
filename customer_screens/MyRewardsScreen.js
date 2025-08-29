import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';

export default function MyRewardsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.pageContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="chevron-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Rewards</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Top Section */}
        <View style={styles.topSection}>
          <FontAwesome name="gift" size={80} color={Colors.white} />
          <Text style={styles.welcomeTitle}>Welcome to Rewards!</Text>
          <Text style={styles.welcomeSubtitle}>
            Discover amazing rewards and exclusive offers from your favorite stores.
          </Text>
        </View>

        {/* White Content Area */}
        <View style={styles.whiteBox}>
          <View style={styles.whiteContent}>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            <View style={styles.rewardsCard}>
              <FontAwesome name="star" size={24} color={Colors.primary} />
              <Text style={styles.rewardsText}>No rewards available yet</Text>
              <Text style={styles.rewardsSubtext}>Complete missions to earn rewards</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  pageContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.quad,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: '700',
  },
  topSection: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.quad,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
  },
  welcomeTitle: {
    color: Colors.white,
    fontSize: Typography.h1,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  welcomeSubtitle: {
    color: Colors.white,
    fontSize: Typography.body,
    textAlign: 'center',
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
  rewardsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.light,
  },
  rewardsText: {
    fontSize: Typography.h2,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  rewardsSubtext: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
