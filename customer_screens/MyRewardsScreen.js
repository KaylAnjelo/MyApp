import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';

export default function MyRewardsScreen({ navigation }) {
  const [rewards, setRewards] = useState([]); // populate from DB when available

  useEffect(() => {
    // TODO: Replace with real database/API call
    // Example:
    // fetchRewardsForUser(userId).then(setRewards).catch(console.error);
  }, []);

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

        {/* White Content Area */}
        <View style={styles.whiteBox}>
          <View style={styles.whiteContent}>
            {rewards.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome name="star" size={18} color={Colors.primary} style={{ marginBottom: 14 }} />
                <Text style={styles.rewardsText}>No rewards available yet</Text>
                <Text style={styles.rewardsSubtext}>Complete missions to earn rewards</Text>
              </View>
            ) : (
              <View>
                {rewards.map((reward, idx) => (
                  <View key={idx} style={styles.rewardItem}>
                    <View style={styles.rewardItemLeft}>
                      <FontAwesome name="gift" size={18} color={Colors.primary} />
                      <Text style={styles.rewardItemTitle}>{reward.title}</Text>
                    </View>
                    <TouchableOpacity style={styles.redeemButton} activeOpacity={0.8} onPress={() => console.log('Redeem', reward.id)}>
                      <Text style={styles.redeemText}>Redeem</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    paddingBottom: Spacing.xxl,
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
    marginTop: 0,
  },
  whiteContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.quad * 2,
  },
  rewardsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.light,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
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
  rewardItem: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    ...Shadows.light,
  },
  rewardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardItemTitle: {
    marginLeft: 10,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  redeemButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.sm,
  },
  redeemText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.small,
  },
});
