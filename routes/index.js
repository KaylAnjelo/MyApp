const express = require('express');
const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// Import route modules
const authRoutes = require('./authRoutes');

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

module.exports = router;