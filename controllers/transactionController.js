const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const crypto = require('crypto');

class TransactionController {
  // Generate unique reference number
  generateReferenceNumber() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  // Generate 6-character alphanumeric code
  generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // CREATE transaction and generate QR data
  async createTransaction(req, res) {
    try {
      const {
        vendor_id,
        store_id,
        items // Array of {product_id, product_name, quantity, price}
      } = req.body;

      if (!vendor_id || !store_id || !items || items.length === 0) {
        return sendError(res, 'Vendor ID, Store ID, and items are required', 400);
      }

      // Verify vendor belongs to the store
      const { data: vendor, error: vendorError } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('user_id', vendor_id)
        .single();

      if (vendorError || !vendor) {
        return sendError(res, 'Vendor not found', 404);
      }

      if (vendor.role !== 'vendor') {
        return sendError(res, 'User is not a vendor', 403);
      }

      if (vendor.store_id !== store_id) {
        return sendError(res, 'Vendor does not belong to this store', 403);
      }

      // Calculate totals
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalPoints = parseFloat((totalAmount * 0.1).toFixed(2)); // 10% of total as points

      // Generate reference number and short code
      const referenceNumber = this.generateReferenceNumber();
      const shortCode = this.generateShortCode();
      const transactionDate = new Date().toISOString();

      // Prepare transaction data
      const qrData = {
        reference_number: referenceNumber,
        short_code: shortCode,
        transaction_date: transactionDate,
        vendor_id: vendor_id,
        store_id: store_id,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price).toFixed(2)
        })),
        total_amount: parseFloat(totalAmount).toFixed(2),
        total_points: totalPoints,
        transaction_type: 'Purchase'
      };

      // Store transaction data temporarily (in-memory cache with 10 min expiry)
      // This allows manual code entry
      if (!global.pendingTransactions) {
        global.pendingTransactions = new Map();
      }
      global.pendingTransactions.set(shortCode, {
        data: qrData,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Return QR data without inserting into database yet
      // The transaction will be inserted when customer scans QR or enters code
      return sendSuccess(res, {
        message: 'Transaction code generated successfully',
        qr_data: qrData,
        qr_string: JSON.stringify(qrData),
        short_code: shortCode
      }, 201);

    } catch (error) {
      console.error('Error creating transaction:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // Process scanned QR code and create transaction
  async processScannedQR(req, res) {
    try {
      const { qr_data, customer_id } = req.body;

      if (!qr_data || !customer_id) {
        return sendError(res, 'QR data and customer ID are required', 400);
      }

      // Parse QR data if it's a string
      const transactionData = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;

      // Use the internal processing method
      return this.processScannedQRInternal(req, res, customer_id, transactionData);
    } catch (error) {
      console.error('Error in processScannedQR:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // DEPRECATED - Old implementation kept for reference
  async processScannedQROld(req, res) {
    try {
      const { qr_data, customer_id } = req.body;

      if (!qr_data || !customer_id) {
        return sendError(res, 'QR data and customer ID are required', 400);
      }

      // Parse QR data if it's a string
      const transactionData = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;

      // Verify customer exists
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('user_id', customer_id)
        .single();

      if (customerError || !customer) {
        return sendError(res, 'Customer not found', 404);
      }

      if (customer.role !== 'customer') {
        return sendError(res, 'User is not a customer', 403);
      }

      // Check if transaction already exists (prevent double scanning)
      const { data: existingTxn } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference_number', transactionData.reference_number)
        .single();

      if (existingTxn) {
        return sendError(res, 'Transaction already processed', 400);
      }

      // Insert transactions for each item
      const transactionInserts = transactionData.items.map(item => ({
        transaction_date: transactionData.transaction_date,
        user_id: customer_id,
        store_id: transactionData.store_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        points: parseFloat((item.price * item.quantity * 0.1).toFixed(2)),
        reference_number: transactionData.reference_number,
        transaction_type: transactionData.transaction_type,
        Vendor_ID: transactionData.vendor_id
      }));

      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .insert(transactionInserts)
        .select();

      if (txnError) {
        return sendError(res, txnError.message, 400);
      }

      // Update customer's points
      const { data: userPoints, error: pointsSelectError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', customer_id)
        .single();

      const totalPointsToAdd = parseFloat(transactionData.total_points);

      if (pointsSelectError || !userPoints) {
        // Create new user_points record
        await supabase
          .from('user_points')
          .insert([{
            user_id: customer_id,
            total_points: totalPointsToAdd,
            redeemed_points: 0
          }]);
      } else {
        // Update existing points
        await supabase
          .from('user_points')
          .update({
            total_points: (userPoints.total_points || 0) + totalPointsToAdd
          })
          .eq('user_id', customer_id);
      }

      return sendSuccess(res, {
        message: 'Transaction processed successfully',
        transactions: transactions,
        points_earned: totalPointsToAdd,
        reference_number: transactionData.reference_number
      }, 201);

    } catch (error) {
      console.error('Error processing scanned QR:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // GET transactions by user (customer or vendor)
  async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.query; // 'customer' or 'vendor'

      if (!userId) {
        return sendError(res, 'User ID is required', 400);
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          products (
            product_name,
            product_image
          ),
          stores (
            store_name
          )
        `)
        .order('transaction_date', { ascending: false });

      if (role === 'vendor') {
        query = query.eq('Vendor_ID', userId);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(res, { transactions: data });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // Process transaction by short code (manual entry)
  async processShortCode(req, res) {
    try {
      const { short_code, customer_id } = req.body;

      if (!short_code || !customer_id) {
        return sendError(res, 'Short code and customer ID are required', 400);
      }

      // Check if pending transactions map exists
      if (!global.pendingTransactions) {
        return sendError(res, 'Invalid or expired code', 400);
      }

      // Get transaction data from cache
      const pending = global.pendingTransactions.get(short_code.toUpperCase());
      
      if (!pending) {
        return sendError(res, 'Invalid or expired code', 400);
      }

      // Check if expired
      if (Date.now() > pending.expiresAt) {
        global.pendingTransactions.delete(short_code.toUpperCase());
        return sendError(res, 'Code has expired', 400);
      }

      // Process the transaction using the cached data
      const qrData = pending.data;
      
      // Use the processScannedQR logic
      return this.processScannedQRInternal(req, res, customer_id, qrData);
    } catch (error) {
      console.error('Error processing short code:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // Internal method to process QR data (shared by QR scan and manual code)
  async processScannedQRInternal(req, res, customer_id, qr_data) {
    try {
      // Validate customer exists
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('user_id', customer_id)
        .single();

      if (customerError || !customer) {
        return sendError(res, 'Customer not found', 404);
      }

      if (customer.role !== 'customer') {
        return sendError(res, 'User is not a customer', 403);
      }

      // Check if transaction already exists (prevent duplicate)
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('transaction_id')
        .eq('reference_number', qr_data.reference_number)
        .single();

      if (existingTransaction) {
        return sendError(res, 'Transaction already processed', 400);
      }

      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          reference_number: qr_data.reference_number,
          transaction_date: qr_data.transaction_date,
          user_id: customer_id,
          Vendor_ID: qr_data.vendor_id,
          store_id: qr_data.store_id,
          transaction_type: qr_data.transaction_type,
          total_amount: qr_data.total_amount,
          total_points: qr_data.total_points,
          items: qr_data.items
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction insert error:', transactionError);
        return sendError(res, transactionError.message, 400);
      }

      // Update customer points
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          user_points: supabase.raw(`COALESCE(user_points, 0) + ${qr_data.total_points}`)
        })
        .eq('user_id', customer_id);

      if (pointsError) {
        console.error('Points update error:', pointsError);
      }

      // Remove from pending transactions if it was a manual code entry
      if (qr_data.short_code && global.pendingTransactions) {
        global.pendingTransactions.delete(qr_data.short_code);
      }

      return sendSuccess(res, {
        message: 'Transaction processed successfully',
        transaction: transaction
      }, 201);
    } catch (error) {
      console.error('Error processing transaction:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
}

module.exports = new TransactionController();
