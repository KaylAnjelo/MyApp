const express = require('express');
const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const promotionRoutes = require('./promotionRoutes');
const rewardRoutes = require('./rewardRoutes');
const redemptionController = require('../controllers/redemptionController');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      return sendError(res, 'Database connection failed', 500, error.message);
    }

    return sendSuccess(res, {
      message: 'Server and database are running',
      status: 'healthy'
    });

  } catch (err) {
    return sendError(res, 'Server error', 500, err.message);
  }
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/promotions', promotionRoutes);
router.use('/rewards', rewardRoutes);
router.use('/', userRoutes);

// Top-level redemption code generation to match client path
router.post('/redemptions/generate-code', (req, res) => redemptionController.generateRedemptionCode(req, res));

module.exports = router;