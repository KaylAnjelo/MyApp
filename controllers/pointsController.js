const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

class PointsController {
  /**
   * Sync user points from transactions
   * POST /api/points/sync/:userId
   */
  async syncUserPoints(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return sendError(res, 'User ID is required', 400);
      }

      console.log(`[PointsController] Syncing points for user ${userId}`);
      
      // Get all transactions for this user
      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      
      if (txnError) {
        console.error('[PointsController] Error fetching transactions:', txnError);
        return sendError(res, 'Error fetching transactions', 500);
      }
      
      console.log(`[PointsController] Found ${transactions?.length || 0} transactions`);
      
      // Group by store_id and sum points
      const pointsByStore = {};
      
      transactions?.forEach(txn => {
        const storeId = txn.store_id;
        const points = parseFloat(txn.points || 0);
        
        if (!pointsByStore[storeId]) {
          pointsByStore[storeId] = { total: 0, redeemed: 0 };
        }
        
        if (txn.transaction_type === 'Purchase') {
          pointsByStore[storeId].total += points;
        } else if (txn.transaction_type === 'Redemption') {
          pointsByStore[storeId].redeemed += Math.abs(points);
          pointsByStore[storeId].total -= Math.abs(points);
        }
      });
      
      console.log('[PointsController] Points by store:', pointsByStore);
      
      const results = [];
      
      // Insert or update user_points for each store
      for (const [storeId, points] of Object.entries(pointsByStore)) {
        console.log(`[PointsController] Processing store ${storeId}...`);
        
        // Check if record exists
        const { data: existing } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', userId)
          .eq('store_id', storeId)
          .single();
        
        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_points')
            .update({
              total_points: Math.round(points.total),
              redeemed_points: Math.round(points.redeemed)
            })
            .eq('user_id', userId)
            .eq('store_id', storeId);
          
          if (updateError) {
            console.error(`[PointsController] Error updating store ${storeId}:`, updateError);
            results.push({ 
              store_id: storeId, 
              status: 'error', 
              error: updateError.message 
            });
          } else {
            console.log(`[PointsController] Updated store ${storeId}: ${Math.round(points.total)} points`);
            results.push({ 
              store_id: storeId, 
              status: 'updated', 
              total_points: Math.round(points.total),
              redeemed_points: Math.round(points.redeemed)
            });
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('user_points')
            .insert({
              user_id: userId,
              store_id: storeId,
              total_points: Math.round(points.total),
              redeemed_points: Math.round(points.redeemed)
            });
          
          if (insertError) {
            console.error(`[PointsController] Error inserting store ${storeId}:`, insertError);
            results.push({ 
              store_id: storeId, 
              status: 'error', 
              error: insertError.message 
            });
          } else {
            console.log(`[PointsController] Inserted store ${storeId}: ${Math.round(points.total)} points`);
            results.push({ 
              store_id: storeId, 
              status: 'inserted', 
              total_points: Math.round(points.total),
              redeemed_points: Math.round(points.redeemed)
            });
          }
        }
      }
      
      console.log('[PointsController] Sync complete');
      
      return sendSuccess(res, {
        message: 'Points synced successfully',
        user_id: userId,
        stores_processed: results.length,
        results
      });
      
    } catch (error) {
      console.error('[PointsController] Error in syncUserPoints:', error);
      return sendError(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Sync all users' points (admin only)
   * POST /api/points/sync-all
   */
  async syncAllUsersPoints(req, res) {
    try {
      console.log('[PointsController] Syncing points for all users');
      
      // Get all unique user IDs from transactions
      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .select('user_id')
        .not('user_id', 'is', null);
      
      if (txnError) {
        console.error('[PointsController] Error fetching transactions:', txnError);
        return sendError(res, 'Error fetching transactions', 500);
      }
      
      const userIds = [...new Set(transactions.map(t => t.user_id))];
      console.log(`[PointsController] Found ${userIds.length} unique users`);
      
      const syncResults = [];
      
      for (const userId of userIds) {
        try {
          // Get all transactions for this user
          const { data: userTransactions, error: userTxnError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId);
          
          if (userTxnError) {
            console.error(`[PointsController] Error fetching transactions for user ${userId}:`, userTxnError);
            syncResults.push({ user_id: userId, status: 'error', error: userTxnError.message });
            continue;
          }
          
          // Group by store_id and sum points
          const pointsByStore = {};
          
          userTransactions?.forEach(txn => {
            const storeId = txn.store_id;
            const points = parseFloat(txn.points || 0);
            
            if (!pointsByStore[storeId]) {
              pointsByStore[storeId] = { total: 0, redeemed: 0 };
            }
            
            if (txn.transaction_type === 'Purchase') {
              pointsByStore[storeId].total += points;
            } else if (txn.transaction_type === 'Redemption') {
              pointsByStore[storeId].redeemed += Math.abs(points);
              pointsByStore[storeId].total -= Math.abs(points);
            }
          });
          
          // Insert or update user_points for each store
          for (const [storeId, points] of Object.entries(pointsByStore)) {
            const { data: existing } = await supabase
              .from('user_points')
              .select('*')
              .eq('user_id', userId)
              .eq('store_id', storeId)
              .single();
            
            if (existing) {
              await supabase
                .from('user_points')
                .update({
                  total_points: Math.round(points.total),
                  redeemed_points: Math.round(points.redeemed)
                })
                .eq('user_id', userId)
                .eq('store_id', storeId);
            } else {
              await supabase
                .from('user_points')
                .insert({
                  user_id: userId,
                  store_id: storeId,
                  total_points: Math.round(points.total),
                  redeemed_points: Math.round(points.redeemed)
                });
            }
          }
          
          syncResults.push({ 
            user_id: userId, 
            status: 'success', 
            stores_processed: Object.keys(pointsByStore).length 
          });
          
        } catch (userError) {
          console.error(`[PointsController] Error syncing user ${userId}:`, userError);
          syncResults.push({ user_id: userId, status: 'error', error: userError.message });
        }
      }
      
      console.log('[PointsController] Sync all complete');
      
      return sendSuccess(res, {
        message: 'All users points synced',
        users_processed: syncResults.length,
        results: syncResults
      });
      
    } catch (error) {
      console.error('[PointsController] Error in syncAllUsersPoints:', error);
      return sendError(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Check user data (transactions and points)
   * GET /api/points/check/:userId
   */
  async checkUserData(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;
      
      if (!userId) {
        return sendError(res, 'User ID is required', 400);
      }

      console.log(`[PointsController] Checking data for user ${userId}`);
      
      // Check transactions
      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .select('*, stores(store_name)')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(parseInt(limit));
      
      if (txnError) {
        console.error('[PointsController] Error fetching transactions:', txnError);
      }
      
      // Check user_points
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('*, stores(store_name)')
        .eq('user_id', userId);
      
      if (pointsError) {
        console.error('[PointsController] Error fetching user_points:', pointsError);
      }
      
      return sendSuccess(res, {
        user_id: userId,
        transactions: {
          count: transactions?.length || 0,
          data: transactions || []
        },
        points: {
          count: points?.length || 0,
          data: points || []
        }
      });
      
    } catch (error) {
      console.error('[PointsController] Error in checkUserData:', error);
      return sendError(res, error.message || 'Internal server error', 500);
    }
  }
}

module.exports = new PointsController();
