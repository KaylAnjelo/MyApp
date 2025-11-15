const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// Get all active promotions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return sendError(res, 'Failed to fetch promotions', 500, error.message);
    }

    return sendSuccess(res, data || []);
  } catch (err) {
    console.error('Server error fetching promotions:', err);
    return sendError(res, 'Server error', 500, err.message);
  }
});

// Get promotions by store ID
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store promotions:', error);
      return sendError(res, 'Failed to fetch store promotions', 500, error.message);
    }

    return sendSuccess(res, data || []);
  } catch (err) {
    console.error('Server error fetching store promotions:', err);
    return sendError(res, 'Server error', 500, err.message);
  }
});

// Get promotion by ID
router.get('/:promotionId', async (req, res) => {
  try {
    const { promotionId } = req.params;

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('promotion_id', promotionId)
      .single();

    if (error) {
      console.error('Error fetching promotion:', error);
      return sendError(res, 'Failed to fetch promotion', 500, error.message);
    }

    return sendSuccess(res, data);
  } catch (err) {
    console.error('Server error fetching promotion:', err);
    return sendError(res, 'Server error', 500, err.message);
  }
});

// Validate promotion code
router.post('/validate', async (req, res) => {
  try {
    const { promotionId, storeId, purchaseAmount } = req.body;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('status', 'active')
      .single();

    if (error || !promotion) {
      return sendError(res, 'Invalid or expired promotion', 400);
    }

    // Check if promotion is for the correct store
    if (promotion.store_id !== storeId) {
      return sendError(res, 'Promotion not valid for this store', 400);
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (now < startDate || now > endDate) {
      return sendError(res, 'Promotion is not currently active', 400);
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return sendError(res, 'Promotion usage limit reached', 400);
    }

    // Check minimum purchase amount
    if (purchaseAmount < promotion.min_purchase_amount) {
      return sendError(res, `Minimum purchase amount of ${promotion.min_purchase_amount} required`, 400);
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.discount_type === 'percentage') {
      discountAmount = (purchaseAmount * promotion.discount_value) / 100;
      if (promotion.max_discount_amount) {
        discountAmount = Math.min(discountAmount, promotion.max_discount_amount);
      }
    } else if (promotion.discount_type === 'fixed') {
      discountAmount = promotion.discount_value;
    }

    return sendSuccess(res, {
      valid: true,
      promotion,
      discountAmount,
      finalAmount: purchaseAmount - discountAmount
    });
  } catch (err) {
    console.error('Server error validating promotion:', err);
    return sendError(res, 'Server error', 500, err.message);
  }
});

// Increment promotion usage count
router.post('/use/:promotionId', async (req, res) => {
  try {
    const { promotionId } = req.params;

    const { data, error } = await supabase
      .rpc('increment_promotion_usage', { promo_id: promotionId });

    if (error) {
      console.error('Error incrementing promotion usage:', error);
      return sendError(res, 'Failed to update promotion usage', 500, error.message);
    }

    return sendSuccess(res, { message: 'Promotion usage updated' });
  } catch (err) {
    console.error('Server error updating promotion usage:', err);
    return sendError(res, 'Server error', 500, err.message);
  }
});

module.exports = router;
