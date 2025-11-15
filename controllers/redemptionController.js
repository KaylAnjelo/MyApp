const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

class RedemptionController {
  // Get all active rewards
  async getRewards(req, res) {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching rewards:', error);
        return sendError(res, 'Failed to fetch rewards', 500, error.message);
      }

      return sendSuccess(res, data || []);
    } catch (err) {
      console.error('Server error fetching rewards:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get rewards by store ID
  async getRewardsByStore(req, res) {
    try {
      const { storeId } = req.params;

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching store rewards:', error);
        return sendError(res, 'Failed to fetch store rewards', 500, error.message);
      }

      return sendSuccess(res, data || []);
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

      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          *,
          rewards:reward_id (
            reward_name,
            description,
            points_required
          ),
          stores:store_id (
            store_name,
            store_image
          )
        `)
        .eq('customer_id', customerId)
        .order('redemption_date', { ascending: false });

      if (error) {
        console.error('Error fetching redemption history:', error);
        return sendError(res, 'Failed to fetch redemption history', 500, error.message);
      }

      console.log('Redemption history count:', data?.length || 0);

      return sendSuccess(res, data || []);
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
