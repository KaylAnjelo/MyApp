import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function MyRewardsScreen({ navigation }) {
  const [rewards, setRewards] = useState([]);
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

      console.log('Fetching redemption history for user:', userId);
      const response = await apiService.getRedemptionHistory(userId);
      console.log('Redemption history response:', response);
      
      const rewardsData = response?.data || response || [];
      
      // Filter for pending rewards only (not yet used)
      const pendingRewards = Array.isArray(rewardsData) 
        ? rewardsData.filter(r => r.status === 'pending')
        : [];
      
      setRewards(pendingRewards);
    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
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
            ) : rewards.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome name="gift" size={48} color="#ccc" style={{ marginBottom: 14 }} />
                <Text style={styles.rewardsText}>No rewards yet</Text>
                <Text style={styles.rewardsSubtext}>Redeem rewards from stores to see them here</Text>
              </View>
            ) : (
              <View>
                {rewards.map((reward, idx) => (
                  <View key={reward.redemption_id || `reward-${idx}`} style={styles.rewardItem}>
                    <View style={styles.rewardItemLeft}>
                      <FontAwesome name="gift" size={18} color={Colors.primary} />
                      <View style={styles.rewardInfo}>
                        <Text style={styles.rewardItemTitle}>{reward.description || 'Reward'}</Text>
                        <Text style={styles.rewardPoints}>{reward.points_used} points • {reward.status}</Text>
                        {reward.redeemed_at && (
                          <Text style={styles.rewardDate}>
                            Redeemed: {new Date(reward.redeemed_at).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.useButton} 
                      activeOpacity={0.8} 
                      onPress={() => Alert.alert('Use Reward', 'Show this to the store owner to claim your reward')}
                    >
                      <Text style={styles.useText}>Use</Text>
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
    flex: 1,
  },
  rewardInfo: {
    marginLeft: 10,
    flex: 1,
  },
  rewardItemTitle: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  rewardPoints: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rewardDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  useButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.sm,
  },
  useText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.small,
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
