// backend/routes/TransactionRoutes.js
const express = require('express');
const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

// GET all transactions for a specific user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('transactions')  // make sure your table is named 'transactions'
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      return sendError(res, 'Failed to fetch transactions', 500, error.message);
    }

    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Server error', 500, err.message);
  }
});

// Optional: Create a new transaction
router.post('/', async (req, res) => {
  const transactionData = req.body;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData]);

    if (error) {
      return sendError(res, 'Failed to create transaction', 500, error.message);
    }

    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, 'Server error', 500, err.message);
  }
});

module.exports = router;
