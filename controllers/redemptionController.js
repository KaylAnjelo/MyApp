const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

class RedemptionController {
    // Mark a claimed reward as used (redeemed)
    async useClaimedReward(req, res) {
      try {
        const { claimedRewardId } = req.params;
        const { userId } = req.body; // Optionally require userId for extra security

        if (!claimedRewardId) {
          return sendError(res, 'claimedRewardId is required', 400);
        }

        // Fetch the claimed reward
        const { data: claimed, error: fetchError } = await supabase
          .from('claimed_rewards')
          .select('*')
          .eq('id', claimedRewardId)
          .maybeSingle();

        if (fetchError || !claimed) {
          return sendError(res, 'Claimed reward not found', 404, fetchError?.message);
        }

        if (claimed.is_redeemed) {
          return sendError(res, 'Voucher already used', 400);
        }

        // Optionally, check userId matches
        if (userId && claimed.user_id !== parseInt(userId)) {
          return sendError(res, 'User does not own this voucher', 403);
        }

        // Mark as redeemed
        const { data: updated, error: updateError } = await supabase
          .from('claimed_rewards')
          .update({ is_redeemed: true })
          .eq('id', parseInt(claimedRewardId))
          .select()
          .single();

        if (updateError) {
          return sendError(res, 'Failed to update voucher status', 500, updateError.message);
        }

        return sendSuccess(res, {
          message: 'Voucher marked as used',
          claimedReward: updated
        });
      } catch (err) {
        return sendError(res, 'Server error', 500, err.message);
      }
    }
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

      // Skip promotions table - not using it
      const promotionsData = [];

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

      // Get claimed rewards for this user (not yet redeemed)
      const { data: claimed, error: claimedError } = await supabase
        .from('claimed_rewards')
        .select('reward_id, is_redeemed')
        .eq('user_id', customerId);

      if (claimedError) {
        console.error('Error fetching claimed_rewards:', claimedError);
        return sendError(res, 'Failed to fetch claimed rewards', 500, claimedError.message);
      }

      // Exclude rewards already claimed and not yet redeemed
      const claimedRewardIds = new Set((claimed || []).filter(r => !r.is_redeemed).map(r => r.reward_id));
      const availableRewards = (rewards || []).filter(r => !claimedRewardIds.has(r.reward_id));

      console.log('Available rewards count (filtered):', availableRewards.length);

      return sendSuccess(res, {
        totalPoints,
        redeemedPoints: userPoints?.redeemed_points || 0,
        availableRewards: availableRewards
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

      console.log('Processing redemption request...');

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

      // Check if customer has enough points AT THIS STORE
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, redeemed_points')
        .eq('user_id', customerId)
        .eq('store_id', storeId)
        .single();

      if (pointsError) {
        if (pointsError.code === 'PGRST116') {
          console.log('No points record found for user', customerId, 'at store', storeId);
          return sendError(res, 'You have no points at this store yet', 400);
        }
        console.error('Error fetching user points:', pointsError);
        return sendError(res, 'Failed to fetch user points', 500, pointsError.message);
      }

      const totalPoints = userPoints?.total_points || 0;
      console.log(`Customer has ${totalPoints} points at store ${storeId}, required:`, reward.points_required);

      if (totalPoints < reward.points_required) {
        return sendError(res, `Insufficient points. You have ${totalPoints}, need ${reward.points_required}`, 400);
      }

      // Get store information for transaction reference
      const { data: storeData } = await supabase
        .from('stores')
        .select('store_name')
        .eq('store_id', storeId)
        .single();

      console.log('Store data retrieved:', storeData?.store_name);

      // Deduct points from user AT THIS STORE
      const newTotalPoints = totalPoints - reward.points_required;
      const newRedeemedPoints = (userPoints.redeemed_points || 0) + reward.points_required;

      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          redeemed_points: newRedeemedPoints
        })
        .eq('user_id', customerId)
        .eq('store_id', storeId);

      if (updateError) {
        console.error('Error updating user points:', updateError);
        return sendError(res, 'Failed to update points', 500, updateError.message);
      }

      console.log('Points updated. New balance:', newTotalPoints);

      // Prevent duplicate claims: check if already claimed
      const { data: alreadyClaimed, error: checkError } = await supabase
        .from('claimed_rewards')
        .select('id')
        .eq('user_id', customerId)
        .eq('reward_id', rewardId)
        .maybeSingle();

      if (checkError) {
        console.warn('Error checking for existing claimed_reward:', checkError.message);
        return sendError(res, 'Failed to check for existing claim', 500, checkError.message);
      }
      if (alreadyClaimed) {
        return sendError(res, 'You have already claimed this voucher.', 400);
      }

      // Insert into claimed_rewards for per-user voucher tracking
      let claimedRewardId = null;
      let transactionError = null;
      try {
        const { data: claimedReward, error: claimedError } = await supabase
          .from('claimed_rewards')
          .insert({
            user_id: parseInt(customerId),
            reward_id: parseInt(rewardId),
            is_redeemed: false
          })
          .select()
          .single();

        if (claimedError || !claimedReward) {
          console.warn('Could not create claimed_reward record:', claimedError?.message);
        } else {
          claimedRewardId = claimedReward.id;
          console.log('Claimed reward created with id:', claimedRewardId);
        }
      } catch (claimedErr) {
        console.warn('Failed to create claimed_reward record:', claimedErr.message);
      }

      // Always create a transaction record for the voucher redemption (reward_id)
      try {
        // Generate reference number
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const storePart = (storeData?.store_name || 'STORE')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 4)
          .padEnd(4, 'X');
        const random = Math.floor(1000 + Math.random() * 9000);
        const referenceNumber = `${storePart}-${datePart}-${random}`;

        const { error: txnError } = await supabase
          .from('transactions')
          .insert({
            reference_number: referenceNumber,
            transaction_date: new Date().toISOString(),
            user_id: parseInt(customerId),
            Vendor_ID: parseInt(ownerId),
            store_id: parseInt(storeId),
            product_id: null, // Not a product purchase
            reward_id: parseInt(rewardId),
            quantity: 1,
            price: 0,
            points: -reward.points_required, // Negative points to indicate deduction
            transaction_type: 'Redemption',
            status: 'active'
          });
        if (txnError) {
          transactionError = txnError;
          console.warn('Could not create transaction record:', txnError.message);
        } else {
          console.log('Transaction record created for redemption:', referenceNumber);
        }
      } catch (txnCatch) {
        transactionError = txnCatch;
        console.warn('Failed to create transaction record:', txnCatch.message);
      }

      return sendSuccess(res, {
        message: 'Reward redeemed successfully',
        remainingPoints: newTotalPoints,
        totalRedeemed: newRedeemedPoints,
        claimedRewardId // This is the voucher code to be used for redemption
      });
    } catch (err) {
      console.error('Server error redeeming reward:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get customer's redemption history from transactions, including reward_name and store_name
  async getRedemptionHistory(req, res) {
    try {
      const { customerId } = req.params;

      console.log('=== GET REDEMPTION HISTORY (claimed_rewards) ===');
      console.log('Customer ID:', customerId);

      // Get claimed rewards for this user, join rewards and stores table for details
      const { data: claimed, error } = await supabase
        .from('claimed_rewards')
        .select(`
          *,
          rewards:reward_id(reward_name, promotion_code, store_id, stores:store_id(store_name))
        `)
        .eq('user_id', customerId)
        .order('claimed_at', { ascending: false });

      if (error) {
        console.error('Error fetching claimed_rewards history:', error);
        return sendError(res, 'Failed to fetch redemption history', 500, error.message);
      }

      // Format data to match expected structure
      const formattedData = (claimed || []).map(row => ({
        claimed_reward_id: row.id,
        claimed_at: row.claimed_at,
        customer_id: row.user_id,
        reward_id: row.reward_id,
        is_redeemed: row.is_redeemed,
        reward_name: row.rewards?.reward_name || null,
        promotion_code: row.rewards?.promotion_code || null,
        store_id: row.rewards?.store_id || null,
        store_name: row.rewards?.stores?.store_name || null
      }));

      console.log('Claimed rewards history count:', formattedData?.length || 0);

      return sendSuccess(res, { data: formattedData });
    } catch (err) {
      console.error('Server error fetching claimed_rewards history:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Update redemption status (for vendors) - now using transactions
  async updateRedemptionStatus(req, res) {
    try {
      const { redemptionId } = req.params;
      const { status } = req.body;

      console.log('=== UPDATE REDEMPTION STATUS ===');
      console.log('Transaction ID:', redemptionId);
      console.log('New status:', status);

      if (!redemptionId || !status) {
        return sendError(res, 'Redemption ID and status are required', 400);
      }
      const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', redemptionId)
        .select()
        .single();
      if (error) {
        return sendError(res, 'Failed to update redemption status', 500, error.message);
      }
      return sendSuccess(res, {
        message: 'Redemption status updated',
        redemption: {
          id: redemptionId,
          status: data.status
        }
      });
    } catch (err) {
      console.error('Server error updating redemption status:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Get store owner's redemptions from transactions
  async getStoreRedemptions(req, res) {
    try {
      const { ownerId } = req.params;

      console.log('=== GET STORE REDEMPTIONS ===');
      console.log('Owner ID:', ownerId);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers:user_id (
            first_name,
            last_name,
            user_email
          ),
          stores:store_id (
            store_name
          )
        `)
        .eq('Vendor_ID', ownerId)
        .eq('transaction_type', 'Redemption')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching store redemptions:', error);
        return sendError(res, 'Failed to fetch store redemptions', 500, error.message);
      }

      // Format data to match expected structure
      const formattedData = (data || []).map(transaction => ({
        redemption_id: transaction.id,
        redemption_date: transaction.transaction_date,
        customer_id: transaction.user_id,
        store_id: transaction.store_id,
        owner_id: transaction.Vendor_ID,
        points_used: Math.abs(transaction.points || 0),
        status: 'completed',
        customers: transaction.customers,
        stores: transaction.stores,
        reference_number: transaction.reference_number
      }));

      console.log('Store redemptions count:', formattedData?.length || 0);

      return sendSuccess(res, formattedData);
    } catch (err) {
      console.error('Server error fetching store redemptions:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Redeem product using points
  async redeemProduct(req, res) {
    try {
      const { customerId, productId, storeId, ownerId, pointsRequired } = req.body;

      console.log('=== REDEEM PRODUCT ===');
      console.log('Request body:', { customerId, productId, storeId, ownerId, pointsRequired });
      console.log('Type check - customerId:', typeof customerId, customerId);
      console.log('Type check - productId:', typeof productId, productId);
      console.log('Type check - storeId:', typeof storeId, storeId);
      console.log('Type check - ownerId:', typeof ownerId, ownerId);
      console.log('Type check - pointsRequired:', typeof pointsRequired, pointsRequired);

      if (!customerId || !productId || !storeId || !ownerId || !pointsRequired) {
        console.log('❌ Missing required fields validation failed');
        console.log('customerId:', customerId, '| productId:', productId, '| storeId:', storeId, '| ownerId:', ownerId, '| pointsRequired:', pointsRequired);
        return sendError(res, 'Missing required fields', 400);
      }
      
      console.log('✓ All required fields present');

      // Get user's current points FOR THIS SPECIFIC STORE
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, redeemed_points')
        .eq('user_id', customerId)
        .eq('store_id', storeId)
        .single();

      if (pointsError) {
        if (pointsError.code === 'PGRST116') {
          // No points record for this store yet
          console.log('No points record found for user', customerId, 'at store', storeId);
          return sendError(res, 'You have no points at this store yet', 400);
        }
        console.error('Error fetching user points:', pointsError);
        return sendError(res, 'Failed to fetch user points', 500, pointsError.message);
      }

      const totalPoints = userPoints?.total_points || 0;
      console.log(`User has ${totalPoints} points at store ${storeId}`);

      // Check if user has enough points
      if (totalPoints < pointsRequired) {
        return sendError(res, `Insufficient points. You have ${totalPoints}, need ${pointsRequired}`, 400);
      }

      // Get store information
      const { data: storeData } = await supabase
        .from('stores')
        .select('store_name')
        .eq('store_id', storeId)
        .single();

      // Deduct points FROM THIS STORE'S BALANCE
      const newTotalPoints = totalPoints - pointsRequired;
      const newRedeemedPoints = (userPoints.redeemed_points || 0) + pointsRequired;

      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          redeemed_points: newRedeemedPoints
        })
        .eq('user_id', customerId)
        .eq('store_id', storeId);

      if (updateError) {
        console.error('Error updating user points:', updateError);
        return sendError(res, 'Failed to update points', 500, updateError.message);
      }

      // Create transaction record
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const storePart = (storeData?.store_name || 'STORE')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4)
        .padEnd(4, 'X');
      const random = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `${storePart}-${datePart}-${random}`;

      const transactionData = {
        reference_number: referenceNumber,
        transaction_date: new Date().toISOString(),
        user_id: parseInt(customerId),
        Vendor_ID: parseInt(ownerId),
        store_id: parseInt(storeId),
        product_id: parseInt(productId),
        quantity: 1,
        price: 0,
        points: -pointsRequired,
        transaction_type: 'Redemption'
      };
      
      console.log('Creating transaction with data:', transactionData);
      console.log('=== ATTEMPTING DATABASE INSERT ===');

      const { data: insertedTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      console.log('=== INSERT COMPLETE ===');
      console.log('Inserted data:', insertedTransaction);
      console.log('Error:', transactionError);

      if (transactionError) {
        console.error('❌ Error creating transaction:', transactionError);
        console.error('Error code:', transactionError.code);
        console.error('Error message:', transactionError.message);
        console.error('Error details:', transactionError.details);
        console.error('Error hint:', transactionError.hint);
        console.error('Full error object:', JSON.stringify(transactionError, null, 2));
        
        // Rollback points if transaction fails
        console.log('Rolling back points...');
        await supabase
          .from('user_points')
          .update({
            total_points: totalPoints,
            redeemed_points: userPoints.redeemed_points
          })
          .eq('user_id', customerId)
          .eq('store_id', storeId);
        
        return sendError(res, 'Failed to create transaction', 500, transactionError.message);
      }

      if (!insertedTransaction || insertedTransaction.length === 0) {
        console.error('⚠️ WARNING: No error but no data returned from insert!');
        console.error('This means the insert was rejected silently');
        console.error('Check your Supabase RLS policies and table permissions');
        
        // Rollback points
        await supabase
          .from('user_points')
          .update({
            total_points: totalPoints,
            redeemed_points: userPoints.redeemed_points
          })
          .eq('user_id', customerId)
          .eq('store_id', storeId);
        
        return sendError(res, 'Transaction insert was blocked - check database policies', 500);
      }

      console.log('✅ Transaction created successfully!');
      console.log('Inserted transaction ID:', insertedTransaction[0]?.id);
      console.log('Full inserted data:', JSON.stringify(insertedTransaction, null, 2));
      console.log('Product redeemed successfully. New balance:', newTotalPoints);

      return sendSuccess(res, {
        message: 'Product redeemed successfully',
        remainingPoints: newTotalPoints,
        pointsUsed: pointsRequired,
        referenceNumber
      });
    } catch (err) {
      console.error('Server error redeeming product:', err);
      return sendError(res, 'Server error', 500, err.message);
    }
  }

  // Generate a unique redemption code for a product (no points deducted yet)
  async generateRedemptionCode(req, res) {
    try {
      const { user_id, product_id, store_id, owner_id, points_required } = req.body;
      // Add debug logging
      console.log('generateRedemptionCode called with:', req.body);

      // Collect missing fields for better error reporting
      const missingFields = [];
      if (!user_id) missingFields.push('user_id');
      if (!product_id) missingFields.push('product_id');
      if (!store_id) missingFields.push('store_id');
      if (!owner_id) missingFields.push('owner_id');
      if (!points_required) missingFields.push('points_required');

      if (missingFields.length > 0) {
        console.warn('Missing required fields:', missingFields, req.body);
        return sendError(
          res,
          `Missing required fields: ${missingFields.join(', ')}`,
          400,
          `Payload: ${JSON.stringify(req.body)}`
        );
      }

      // Generate a unique code (6-digit alphanumeric)
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Save to pending_transactions table (instead of pending_redemptions)
      const { data, error } = await supabase
        .from('pending_transactions')
        .insert({
          user_id,
          product_id,
          store_id,
          owner_id,
          points_required,
          code,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return sendError(res, 'Failed to save redemption code', 500, error.message);
      }

      // Always return both 'redemption_code' and 'code'
      return sendSuccess(res, { redemption_code: code, code });
    } catch (err) {
      return sendError(res, 'Server error', 500, err.message);
    }
  }
}

module.exports = new RedemptionController();
