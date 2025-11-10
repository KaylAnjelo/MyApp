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

      // Generate reference number
      const referenceNumber = this.generateReferenceNumber();
      const transactionDate = new Date().toISOString();

      // Prepare QR code data
      const qrData = {
        reference_number: referenceNumber,
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

      // Return QR data without inserting into database yet
      // The transaction will be inserted when customer scans the QR code
      return sendSuccess(res, {
        message: 'QR code data generated successfully',
        qr_data: qrData,
        qr_string: JSON.stringify(qrData)
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
}

module.exports = new TransactionController();
