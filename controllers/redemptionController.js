const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

class RedemptionController {
  // Helper function to auto-update promotion statuses based on dates
  async updatePromotionStatuses(storeId = null) {
    const now = new Date();
    
    // Build query to get all rewards
    let query = supabase
      .from('rewards')
      .select('reward_id, start_date, end_date, is_active');
    
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    
    const { data: rewards, error } = await query;
    
    if (error || !rewards) {
      console.error('Error fetching rewards for status update:', error);
      return;
    }
    
    // Update each reward's status based on dates
    for (const reward of rewards) {
      let shouldBeActive = false;
      
      if (reward.start_date && reward.end_date) {
        const startDate = new Date(reward.start_date);
        const endDate = new Date(reward.end_date);
        
        // Set time boundaries for accurate comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        // Active if current date is between start and end dates
        shouldBeActive = now >= startDate && now <= endDate;
      } else {
        // If no dates specified, keep current status
        shouldBeActive = reward.is_active;
      }
      
      // Only update if status needs to change
      if (reward.is_active !== shouldBeActive) {
        await supabase
          .from('rewards')
          .update({ is_active: shouldBeActive })
          .eq('reward_id', reward.reward_id);
        
        console.log(`Updated reward ${reward.reward_id} status to ${shouldBeActive}`);
      }
    }
  }

  // Get all active rewards
  async getRewards(req, res) {
    try {
      // Auto-update statuses before fetching
      await this.updatePromotionStatuses();

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching rewards:', error);
        return sendError(res, 'Failed to fetch rewards', 500, error.message);
      }

      return sendSuccess(res, { data: data || [] });
    } catch (err) {
      console.error('Server error fetching rewards:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get rewards by store ID
  async getRewardsByStore(req, res) {
    try {
      const { storeId } = req.params;
      console.log('=== Fetching rewards for store:', storeId);

      // Auto-update statuses for this store before fetching
      await this.updatePromotionStatuses(storeId);

      // Fetch rewards (point-based redemptions)
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
        return sendError(res, 'Failed to fetch rewards', 500, rewardsError.message);
      }

      // Fetch promotions (discount-based offers)
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (promotionsError) {
        console.warn('Error fetching promotions:', promotionsError);
        // Don't fail if promotions fail, just use rewards only
      }

      // Combine rewards and promotions, marking each with a type
      const allRewards = [
        ...(rewardsData || []).map(r => ({ ...r, type: 'reward', id: r.reward_id })),
        ...(promotionsData || []).map(p => ({ ...p, type: 'promotion', id: p.promotion_id }))
      ];

      console.log('Rewards found:', rewardsData?.length || 0);
      console.log('Promotions found:', promotionsData?.length || 0);
      console.log('Total items:', allRewards.length);
      
      return sendSuccess(res, { data: allRewards });
    } catch (err) {
      console.error('Server error fetching store rewards:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get reward by ID
  async getReward(req, res) {
    try {
      const { rewardId } = req.params;

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('reward_id', rewardId)
        .single();

      if (error) {
        console.error('Error fetching reward:', error);
        return sendError(res, 'Failed to fetch reward', 500, error.message);
      }

      return sendSuccess(res, data);
    } catch (err) {
      console.error('Server error fetching reward:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get customer's available rewards based on their points
  async getAvailableRewards(req, res) {
    try {
      const { customerId } = req.params;

      console.log('=== GET AVAILABLE REWARDS ===');
      console.log('Customer ID:', customerId);

      // Get customer's total points
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, redeemed_points')
        .eq('user_id', customerId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.error('Error fetching user points:', pointsError);
        return sendError(res, 'Failed to fetch user points', 500, pointsError.message);
      }

      const totalPoints = userPoints?.total_points || 0;
      console.log('Customer total points:', totalPoints);

      // Get all active rewards that customer can afford
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .lte('points_required', totalPoints)
        .order('points_required', { ascending: false });

      if (rewardsError) {
        console.error('Error fetching available rewards:', rewardsError);
        return sendError(res, 'Failed to fetch available rewards', 500, rewardsError.message);
      }

      console.log('Available rewards count:', rewards?.length || 0);

      return sendSuccess(res, {
        totalPoints,
        redeemedPoints: userPoints?.redeemed_points || 0,
        availableRewards: rewards || []
      });
    } catch (err) {
      console.error('Server error fetching available rewards:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Create reward redemption
  async redeemReward(req, res) {
    try {
      const { customerId, rewardId, storeId, ownerId } = req.body;

      console.log('=== REDEEM REWARD ===');
      console.log('Request body:', { customerId, rewardId, storeId, ownerId });

      if (!customerId || !rewardId || !storeId || !ownerId) {
        return sendError(res, 'Missing required fields: customerId, rewardId, storeId, ownerId', 400);
      }

      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('reward_id', rewardId)
        .eq('is_active', true)
        .single();

      if (rewardError || !reward) {
        console.error('Reward not found:', rewardError);
        return sendError(res, 'Reward not found or inactive', 404);
      }

      console.log('Reward details:', reward);

      // Check if reward belongs to the specified store
      if (reward.store_id !== parseInt(storeId)) {
        return sendError(res, 'Reward does not belong to this store', 400);
      }

      // Check if customer has enough points
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, redeemed_points')
        .eq('user_id', customerId)
        .single();

      if (pointsError) {
        console.error('Error fetching user points:', pointsError);
        return sendError(res, 'Failed to fetch user points', 500, pointsError.message);
      }

      const totalPoints = userPoints?.total_points || 0;
      console.log('Customer points:', totalPoints, 'Required:', reward.points_required);

      if (totalPoints < reward.points_required) {
        return sendError(res, `Insufficient points. You have ${totalPoints}, need ${reward.points_required}`, 400);
      }

      // Create redemption record
      const { data: redemption, error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          customer_id: parseInt(customerId),
          store_id: parseInt(storeId),
          reward_id: parseInt(rewardId),
          owner_id: parseInt(ownerId),
          points_used: reward.points_required,
          status: 'pending',
          description: reward.description
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Error creating redemption:', redemptionError);
        return sendError(res, 'Failed to create redemption', 500, redemptionError.message);
      }

      console.log('Redemption created:', redemption);

      // Deduct points from user
      const newTotalPoints = totalPoints - reward.points_required;
      const newRedeemedPoints = (userPoints.redeemed_points || 0) + reward.points_required;

      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          redeemed_points: newRedeemedPoints
        })
        .eq('user_id', customerId);

      if (updateError) {
        console.error('Error updating user points:', updateError);
        // Rollback redemption if points update fails
        await supabase
          .from('redemptions')
          .delete()
          .eq('redemption_id', redemption.redemption_id);
        
        return sendError(res, 'Failed to update points', 500, updateError.message);
      }

      console.log('Points updated. New balance:', newTotalPoints);

      return sendSuccess(res, {
        message: 'Reward redeemed successfully',
        redemption,
        remainingPoints: newTotalPoints,
        totalRedeemed: newRedeemedPoints
      });
    } catch (err) {
      console.error('Server error redeeming reward:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get customer's redemption history
  async getRedemptionHistory(req, res) {
    try {
      const { customerId } = req.params;

      console.log('=== GET REDEMPTION HISTORY ===');
      console.log('Customer ID:', customerId);

      // Get redemptions without joins first
      const { data: redemptions, error } = await supabase
        .from('redemptions')
        .select('*')
        .eq('customer_id', customerId)
        .order('redemption_date', { ascending: false });

      if (error) {
        console.error('Error fetching redemption history:', error);
        return sendError(res, 'Failed to fetch redemption history', 500, error.message);
      }

      // Enrich with reward and store details manually
      const enrichedData = await Promise.all(
        (redemptions || []).map(async (redemption) => {
          // Get reward details
          let rewardDetails = null;
          if (redemption.reward_id) {
            const { data: reward } = await supabase
              .from('rewards')
              .select('reward_name, description, points_required')
              .eq('reward_id', redemption.reward_id)
              .single();
            rewardDetails = reward;
          }

          // Get store details
          let storeDetails = null;
          if (redemption.store_id) {
            const { data: store } = await supabase
              .from('stores')
              .select('store_name, store_image')
              .eq('store_id', redemption.store_id)
              .single();
            storeDetails = store;
          }

          return {
            ...redemption,
            reward_name: rewardDetails?.reward_name || redemption.description,
            reward_description: rewardDetails?.description,
            points_required: rewardDetails?.points_required,
            store_name: storeDetails?.store_name,
            store_image: storeDetails?.store_image,
          };
        })
      );

      console.log('Redemption history count:', enrichedData?.length || 0);

      return sendSuccess(res, { data: enrichedData || [] });
    } catch (err) {
      console.error('Server error fetching redemption history:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Update redemption status (for vendors)
  async updateRedemptionStatus(req, res) {
    try {
      const { redemptionId } = req.params;
      const { status } = req.body;

      console.log('=== UPDATE REDEMPTION STATUS ===');
      console.log('Redemption ID:', redemptionId);
      console.log('New status:', status);

      if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return sendError(res, 'Invalid status. Must be: pending, completed, or cancelled', 400);
      }

      const { data, error } = await supabase
        .from('redemptions')
        .update({ status })
        .eq('redemption_id', redemptionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating redemption status:', error);
        return sendError(res, 'Failed to update redemption status', 500, error.message);
      }

      console.log('Redemption updated:', data);

      return sendSuccess(res, {
        message: 'Redemption status updated',
        redemption: data
      });
    } catch (err) {
      console.error('Server error updating redemption status:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get store owner's redemptions
  async getStoreRedemptions(req, res) {
    try {
      const { ownerId } = req.params;
      const { status } = req.query; // Optional filter

      console.log('=== GET STORE REDEMPTIONS ===');
      console.log('Owner ID:', ownerId);
      console.log('Status filter:', status);

      let query = supabase
        .from('redemptions')
        .select(`
          *,
          rewards:reward_id (
            reward_name,
            description,
            points_required
          ),
          customers:customer_id (
            first_name,
            last_name,
            user_email
          ),
          stores:store_id (
            store_name
          )
        `)
        .eq('owner_id', ownerId)
        .order('redemption_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching store redemptions:', error);
        return sendError(res, 'Failed to fetch store redemptions', 500, error.message);
      }

      console.log('Store redemptions count:', data?.length || 0);

      return sendSuccess(res, data || []);
    } catch (err) {
      console.error('Server error fetching store redemptions:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }
}

module.exports = new RedemptionController();
