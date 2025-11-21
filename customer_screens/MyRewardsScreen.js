import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Pressable, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function MyRewardsScreen({ navigation }) {
  const [comingSoonRewards, setComingSoonRewards] = useState([]);
  const [activeRewards, setActiveRewards] = useState([]);
  const [usedRewards, setUsedRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal states for themed alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStage, setModalStage] = useState('confirm'); // 'confirm' | 'code'
  const [selectedReward, setSelectedReward] = useState(null);
  // editable fields for redemption flow
  const [codeInput, setCodeInput] = useState('');
  const [storeInput, setStoreInput] = useState('');
  const [pointsInput, setPointsInput] = useState('');


  useEffect(() => {
    loadRewards();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRewards();
    });
    return unsubscribe;
  }, [navigation]);

  // Restore the loadRewards function
  const loadRewards = async () => {
    try {
      setLoading(true);

      const userString = await AsyncStorage.getItem('@app_user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.user_id;

      if (!userId) {
        console.log('No user ID found');
        setLoading(false);
        return;
      }

      // Fetch redemption history instead of just rewards
      let redemptionsList = [];
      try {
        const resp = apiService.getRedemptionHistory ? await apiService.getRedemptionHistory(userId) : null;
        const data = resp?.data || resp || [];
        redemptionsList = Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn('Failed to fetch redemption history:', err);
        redemptionsList = [];
      }

      // Sort redemptions by date (most recent first)
      redemptionsList.sort((a, b) => (new Date(b.redemption_date)) - (new Date(a.redemption_date)));

      // Partition into active and used/expired (for now, all are considered used except the most recent one)
      const now = new Date();
      const comingSoon = [];
      const activeListPH = [];
      const usedExpired = [];

      redemptionsList.forEach((r, idx) => {
        // If you want to mark the most recent as active, or use a status field, adjust here
        if (idx === 0 && r.status !== 'expired') {
          activeListPH.push(r);
        } else {
          usedExpired.push(r);
        }
      });

      setComingSoonRewards(comingSoon);
      setActiveRewards(activeListPH);
      setUsedRewards(usedExpired);

    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMeta = (reward) => {
    const now = new Date();
    const startDate = reward.start_date ? new Date(new Date(reward.start_date).getTime() + 8*60*60*1000) : null;
    const endDate = reward.end_date ? new Date(new Date(reward.end_date).getTime() + 8*60*60*1000) : null;

    if (startDate && now < startDate) return { label: 'Coming Soon', color: '#1976d2' };
    if (endDate && now > endDate) return { label: 'Expired', color: '#9e9e9e' };
    return { label: 'Active', color: '#4caf50' };
  };

  const handleUseReward = (reward) => {
    setSelectedReward(reward);
    // prefill fields (convert redemption id to display code)
    const redemptionCode = reward?.redemption_id ? `RWD-${reward.redemption_id}` : '';
    setCodeInput(redemptionCode);
    setStoreInput(reward?.store_name || '');
    setPointsInput(reward?.points_used != null ? String(reward.points_used) : '');
    setModalStage('confirm');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReward(null);
    setModalStage('confirm');
    setCodeInput('');
    setStoreInput('');
    setPointsInput('');
  };

  const showRedemptionCode = () => {
    // Set codeInput to promotion_code if available, else fallback to redemption_id
    if (selectedReward?.promotion_code) {
      setCodeInput(selectedReward.promotion_code);
    } else if (selectedReward?.redemption_id) {
      setCodeInput(`RWD-${selectedReward.redemption_id}`);
    }
    setModalStage('code');
  };

  function renderSection(title, rewards, isActive = true) {
    return (
      <>
        <Text style={[styles.rewardsText, { marginBottom: Spacing.sm }]}>{title}</Text>
        {rewards.length === 0 ? (
          <Text style={styles.rewardsSubtext}>
            {title === 'Used / Expired Vouchers'
              ? 'No rewards have yet to be used or expired'
              : 'No rewards in this section'}
          </Text>
        ) : rewards.map(r => renderRewardCard(r, isActive))}
      </>
    );
  }

  const renderRewardCard = (reward, isActive = true) => {
    const meta = getStatusMeta(reward);
    return (
      <View key={reward.redemption_id || reward.reward_name} style={styles.rewardCard}>
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
              {!isActive && (
                <View style={[styles.statusBadge, { backgroundColor: meta.color }]}> 
                  <Text style={[styles.statusText, { color: '#fff' }]}>{meta.label}</Text>
                </View>
              )}
            </View>
            {reward.redemption_date && (
              <Text style={styles.rewardDate}>
                {new Date(reward.redemption_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
        {isActive && (
          <TouchableOpacity style={styles.useButton} activeOpacity={0.7} onPress={() => handleUseReward(reward)}>
            <Text style={styles.useText}>Use Now</Text>
            <FontAwesome name="chevron-right" size={14} color={Colors.white} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Themed modal for Use / Redemption flow */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {modalStage === 'confirm' ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Use Reward</Text>
                <Text style={[styles.modalMessage, { textAlign: 'center' }]}> 
                  {`Are you sure you want to use this reward?\n\n"${selectedReward?.reward_name || selectedReward?.description}"\n\nShow the code below to the vendor to claim your reward.`}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: Spacing.md }}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={closeModal}>
                    <Text style={[styles.modalButtonText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={showRedemptionCode}>
                    <Text style={[styles.modalButtonText, { color: Colors.white }]}>Show Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}> 
                  {selectedReward?.reward_name || selectedReward?.description || 'Reward'}
                </Text>
                {/* Show the code in a styled box */}
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{codeInput || selectedReward?.promotion_code || '—'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, { marginTop: Spacing.lg, width: '60%' }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.modalButtonText, { color: Colors.white, textAlign: 'center' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
            ) : (
              <>
                {renderSection('Coming Soon', comingSoonRewards, false)}
                {renderSection('Active Vouchers', activeRewards, true)}
                {renderSection('Used / Expired Vouchers', usedRewards, false)}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Keep your styles here (no changes needed)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  pageContent: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.quad, paddingBottom: Spacing.xxl, backgroundColor: Colors.primary },
  headerTitle: { color: Colors.white, fontSize: Typography.h3, fontWeight: '700' },
  whiteBox: { flex: 1, backgroundColor: '#f5f5f5', marginTop: 0 },
  whiteContent: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  rewardsText: { fontSize: Typography.h2, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  rewardsSubtext: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  rewardCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.medium, borderWidth: 1, borderColor: '#e0e0e0' },
  rewardCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  rewardIconContainer: { width: 48, height: 48, borderRadius: Radii.md, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rewardInfo: { flex: 1 },
  rewardItemTitle: { fontSize: Typography.h4, color: Colors.textPrimary, fontWeight: '700', marginBottom: 4 },
  storeName: { fontSize: Typography.small, color: Colors.textSecondary, marginBottom: Spacing.sm },
  rewardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  pointsBadge: { backgroundColor: '#e3f2fd', paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radii.sm },
  pointsBadgeText: { fontSize: 12, color: '#1565c0', fontWeight: '600' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radii.sm },
  statusText: { fontSize: 12, fontWeight: '600' },
  rewardDate: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.sm },
  useButton: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: Radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginTop: Spacing.md, ...Shadows.light },
  useText: { color: Colors.white, fontWeight: '700', fontSize: Typography.body },

  // Themed modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalMessage: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.sm,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonCancel: {
    backgroundColor: '#eee',
    marginRight: 8,
  },
  modalButtonText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  codeBox: {
    backgroundColor: '#fafafa',
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#eee',
  },
  codeText: {
    fontSize: Typography.h4,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1.2,
  },
  fieldLabel: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: Typography.h4,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  fieldInput: {
    backgroundColor: '#fafafa',
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
});
