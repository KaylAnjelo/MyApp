import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function MyRewardsScreen({ navigation }) {
  // split rewards into active (pending) and used/expired
  const [activeRewards, setActiveRewards] = useState([]);
  const [usedRewards, setUsedRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewards();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadRewards();
    });

    return unsubscribe;
  }, [navigation]);

  const loadRewards = async () => {
    try {
      setLoading(true);

      // Get user ID from AsyncStorage
      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;

      if (!userId) {
        console.log('No user ID found');
        setLoading(false);
        return;
      }

      console.log('Fetching active rewards (rewards table) and redemption history for user:', userId);

      // 1) Try to fetch active vouchers from the rewards table (apiService.getRewards)
      let activeList = [];
      try {
        // Expectation: apiService.getRewards(userId) returns array or { data: [...] }
        const activeResp = apiService.getRewards ? await apiService.getRewards(userId) : null;
        const activeData = activeResp?.data || activeResp || [];
        activeList = Array.isArray(activeData) ? activeData : [];
      } catch (err) {
        console.warn('Failed to fetch rewards table (active vouchers):', err);
        activeList = [];
      }

      // 2) Fetch redemption history for used/expired vouchers
      let redemptionList = [];
      try {
        const resp = await apiService.getRedemptionHistory(userId);
        const rewardsData = resp?.data || resp || [];
        redemptionList = Array.isArray(rewardsData) ? rewardsData : [];
      } catch (err) {
        console.warn('Failed to fetch redemption history:', err);
        redemptionList = [];
      }

      // Use all entries from rewards table as active vouchers (source: rewards table)
      setActiveRewards(activeList);
      // Use redemption history entries that are not pending as used/expired
      setUsedRewards(redemptionList.filter(r => (r.status || '').toLowerCase() !== 'pending'));
    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  // helper to map status -> display and color
  const getStatusMeta = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'expired') return { label: 'Expired', color: '#9e9e9e' };
    if (s === 'redeemed' || s === 'used') return { label: 'Redeemed', color: '#6b6b6b' };
    return { label: status || 'Status', color: '#9e9e9e' };
  };

  const handleUseReward = (reward) => {
    Alert.alert(
      'Use Reward',
      `Are you sure you want to use this reward?\n\n"${reward.reward_name || reward.description}"\n\nShow the code below to the vendor to claim your reward.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Show Code',
          onPress: () => {
            // Show the redemption code
            const redemptionCode = reward.redemption_id ? `RWD-${reward.redemption_id}` : 'N/A';
            Alert.alert(
              'Redemption Code',
              `Show this code to the vendor:\n\n${redemptionCode}\n\nStore: ${reward.store_name || 'Unknown'}\nPoints Used: ${reward.points_used}`,
              [
                {
                  text: 'Done',
                  style: 'default'
                }
              ],
              { cancelable: false }
            );
          }
        }
      ]
    );
  };

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
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.rewardsText}>Loading rewards...</Text>
              </View>
            ) : (activeRewards.length === 0 && usedRewards.length === 0) ? (
              <View style={styles.emptyState}>
                <FontAwesome name="gift" size={48} color="#ccc" style={{ marginBottom: 14 }} />
                <Text style={styles.rewardsText}>No rewards yet</Text>
                <Text style={styles.rewardsSubtext}>Redeem rewards from stores to see them here</Text>
              </View>
            ) : (
              <View>
                {/* Active Vouchers */}
                <Text style={[styles.rewardsText, { marginBottom: Spacing.sm }]}>Active Vouchers</Text>
                {activeRewards.length === 0 ? (
                  <Text style={styles.rewardsSubtext}>No active vouchers</Text>
                ) : (
                  activeRewards.map((reward, idx) => (
                    <View key={reward.redemption_id || `active-${idx}`} style={styles.rewardCard}>
                      <View style={styles.rewardCardHeader}>
                        <View style={styles.rewardIconContainer}>
                          <FontAwesome name="gift" size={24} color={Colors.primary} />
                        </View>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardItemTitle}>{reward.reward_name || reward.description || 'Reward'}</Text>
                          {reward.store_name && <Text style={styles.storeName}>{reward.store_name}</Text>}
                          <View style={styles.rewardMeta}>
                            <View style={styles.pointsBadge}>
                              <Text style={styles.pointsBadgeText}>{reward.points_used} pts</Text>
                            </View>
                          </View>
                          {reward.redemption_date && (
                            <Text style={styles.rewardDate}>
                              {new Date(reward.redemption_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.useButton} 
                        activeOpacity={0.7} 
                        onPress={() => handleUseReward(reward)}
                      >
                        <Text style={styles.useText}>Use Now</Text>
                        <FontAwesome name="chevron-right" size={14} color={Colors.white} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {/* Used / Expired Vouchers */}
                <Text style={[styles.rewardsText, { marginTop: Spacing.lg, marginBottom: Spacing.sm }]}>Used / Expired Vouchers</Text>
                {usedRewards.length === 0 ? (
                  <Text style={styles.rewardsSubtext}>No used or expired vouchers</Text>
                ) : (
                  usedRewards.map((reward, idx) => {
                    const meta = getStatusMeta(reward.status);
                    return (
                      <View key={reward.redemption_id || `used-${idx}`} style={styles.rewardCard}>
                        <View style={styles.rewardCardHeader}>
                          <View style={styles.rewardIconContainer}>
                            <FontAwesome name="gift" size={24} color={Colors.primary} />
                          </View>
                          <View style={styles.rewardInfo}>
                            <Text style={styles.rewardItemTitle}>{reward.reward_name || reward.description || 'Reward'}</Text>
                            {reward.store_name && <Text style={styles.storeName}>{reward.store_name}</Text>}
                            <View style={styles.rewardMeta}>
                              <View style={styles.pointsBadge}>
                                <Text style={styles.pointsBadgeText}>{reward.points_used} pts</Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: meta.color }]}>
                                <Text style={[styles.statusText, { color: '#fff' }]}>{meta.label}</Text>
                              </View>
                            </View>
                            {reward.redemption_date && (
                              <Text style={styles.rewardDate}>
                                {new Date(reward.redemption_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
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
    backgroundColor: '#f5f5f5',
    marginTop: 0,
  },
  whiteContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
  rewardCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rewardCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardItemTitle: {
    fontSize: Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  storeName: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  rewardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  pointsBadge: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  pointsBadgeText: {
    fontSize: 12,
    color: '#1565c0',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  useButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.md,
    ...Shadows.light,
  },
  useText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.body,
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
