// backend/routes/transactionRoutes.js
const express = require('express');
const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

// GET all transactions for a specific user (customer)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch transactions', 500, error.message);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Server error', 500, err.message);
  }
});

// GET all transactions for a specific store (vendor)
router.get('/store/:storeId', async (req, res) => {
  const { storeId } = req.params;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .order('transaction_date', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch store transactions', 500, error.message);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Server error', 500, err.message);
  }
});

// POST create a new transaction
router.post('/', async (req, res) => {
  const transactionData = req.body;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData]);

    if (error) return sendError(res, 'Failed to create transaction', 500, error.message);
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Server error', 500, err.message);
  }
});

module.exports = router;
