const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const crypto = require('crypto');

// Initialize global pending transactions map as fallback
if (!global.pendingTransactions) {
  global.pendingTransactions = new Map();
  console.log('[TransactionController] Initialized pendingTransactions map');
}

// Reference number format: STORE-YYYYMMDD-####
const REFERENCE_REGEX = /^[A-Z0-9]{4}-\d{8}-\d{4}$/;

// Helper functions moved outside class
function generateReferenceNumber(dateString, storeName) {
  const datePart = new Date(dateString || Date.now())
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const storePart = String(storeName || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'X');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${storePart}-${datePart}-${random}`;
}

function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

class TransactionController {
  // CREATE transaction and generate QR data
  async createTransaction(req, res) {
    try {
      const {
        vendor_id,
        store_id,
        items // Array of {product_id, product_name, quantity, price}
      } = req.body;

      console.log('Generate QR Request:', { vendor_id, store_id, itemCount: items?.length });

      if (!vendor_id || !store_id || !items || items.length === 0) {
        console.error('Missing required fields:', { vendor_id, store_id, items: items?.length });
        return sendError(res, 'Vendor ID, Store ID, and items are required', 400);
      }

      // Verify vendor belongs to the store
      const { data: vendor, error: vendorError } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('user_id', vendor_id)
        .single();

      console.log('Vendor lookup result:', { vendor, vendorError });

      if (vendorError || !vendor) {
        console.error('Vendor not found:', vendorError);
        return sendError(res, 'Vendor not found', 404);
      }

      if (vendor.role !== 'vendor') {
        console.error('User is not a vendor:', vendor.role);
        return sendError(res, 'User is not a vendor', 403);
      }

      // Convert both to numbers for comparison (in case one is string)
      const vendorStoreId = parseInt(vendor.store_id);
      const requestedStoreId = parseInt(store_id);

      if (vendorStoreId !== requestedStoreId) {
        console.error('Store mismatch:', { 
          vendor_store_id: vendorStoreId, 
          requested_store_id: requestedStoreId,
          vendor_store_id_type: typeof vendor.store_id,
          requested_store_id_type: typeof store_id
        });
        return sendError(res, `Vendor does not belong to this store. Vendor belongs to store ${vendorStoreId}, but requested store ${requestedStoreId}`, 403);
      }

      // Calculate totals
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalPoints = parseFloat((totalAmount * 0.1).toFixed(2)); // 10% of total as points

      const transactionDate = new Date().toISOString();

      // Fetch store name for reference number
      const { data: storeInfo } = await supabase
        .from('stores')
        .select('store_name')
        .eq('store_id', store_id)
        .single();

      const referenceNumber = generateReferenceNumber(transactionDate, storeInfo?.store_name || `S${String(store_id).slice(-3)}`);
      const shortCode = generateShortCode();

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

      // Store transaction data in database with 10 min expiry
      // This allows manual code entry and persists across server restarts
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      const { data: storedCode, error: storeError } = await supabase
        .from('pending_transactions')
        .insert([{
          short_code: shortCode,
          reference_number: referenceNumber,
          transaction_data: qrData,
          expires_at: expiresAt.toISOString(),
          used: false
        }])
        .select();

      if (storeError) {
        console.error('Error storing pending transaction in DB:', storeError);
        // Fall back to in-memory storage if database fails
        if (!global.pendingTransactions) {
          global.pendingTransactions = new Map();
        }
        global.pendingTransactions.set(shortCode, {
          data: qrData,
          expiresAt: Date.now() + 10 * 60 * 1000
        });
        console.log('Stored in in-memory cache as fallback');
      } else {
        console.log('Stored transaction in DB with code:', shortCode, 'expires at:', expiresAt.toISOString());
      }

      // Return QR data without inserting into database yet
      // The transaction will be inserted when customer scans QR or enters code
      console.log('Transaction code generated:', { shortCode, referenceNumber });

      return sendSuccess(res, {
        message: 'Transaction code generated successfully',
        qr_data: qrData,
        qr_string: JSON.stringify(qrData),
        short_code: shortCode
      }, 201);

    } catch (error) {
      console.error('Error creating transaction:', error);
      console.error('Error stack:', error.stack);
      return sendError(res, `Internal server error: ${error.message}`, 500);
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

  // GET transactions by store
  async getStoreTransactions(req, res) {
    try {
      const { storeId } = req.params;

      if (!storeId) {
        return sendError(res, 'Store ID is required', 400);
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          products (
            product_name,
            product_image
          ),
          customer:user_id ( 
            first_name,
            last_name,
            username,
            user_email
          )
        `)
        .eq('store_id', storeId)
        .order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return sendError(res, error.message, 400); 
      }

      return sendSuccess(res, { transactions: data });
    } catch (error) {
      console.error('Error fetching store transactions:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // Process transaction by short code (manual entry)
  async processShortCode(req, res) {
    try {
      const { short_code, customer_id } = req.body;

      console.log('Processing short code:', short_code, 'for customer:', customer_id);

      if (!short_code || !customer_id) {
        return sendError(res, 'Short code and customer ID are required', 400);
      }

      const codeUpper = short_code.toUpperCase().trim();
      console.log('Looking for code:', codeUpper);

      // First, try to find in database
      const { data: pendingCodes, error: dbError } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('short_code', codeUpper)
        .eq('used', false)
        .single();

      let pending = null;
      let pendingId = null;

      if (!dbError && pendingCodes) {
        pending = pendingCodes;
        pendingId = pendingCodes.id;
        console.log('Found code in database:', codeUpper);
      } else {
        console.log('Code not found in database, checking in-memory cache');
        // Fall back to in-memory cache
        if (global.pendingTransactions) {
          pending = global.pendingTransactions.get(codeUpper);
          if (pending) {
            console.log('Found code in in-memory cache');
          }
        }
      }

      if (!pending) {
        console.log('Code not found anywhere');
        return sendError(res, 'Invalid or expired code. Please generate a new code.', 400);
      }

      // Check if expired
      const expiresAt = pending.expires_at ? new Date(pending.expires_at).getTime() : pending.expiresAt;
      if (Date.now() > expiresAt) {
        console.log('Code expired:', codeUpper);
        // Mark as used in database if applicable
        if (pendingId) {
          await supabase
            .from('pending_transactions')
            .update({ used: true })
            .eq('id', pendingId);
        }
        // Remove from in-memory cache
        if (global.pendingTransactions) {
          global.pendingTransactions.delete(codeUpper);
        }
        return sendError(res, 'Code has expired', 400);
      }

      console.log('Code valid, processing transaction...');

      // Get the transaction data
      const qrData = pending.transaction_data || pending.data;

      // Call internal processing method
      return this.processScannedQRInternal(req, res, customer_id, qrData, pendingId);
    } catch (error) {
      console.error('Error in processShortCode:', error);
      console.error('Error stack:', error.stack);
      return sendError(res, `Short code error: ${error.message}`, 500);
    }
  }

  // Internal method to process QR data (shared by QR scan and manual code)
  async processScannedQRInternal(req, res, customer_id, qr_data, pendingId = null) {
    try {
      console.log('processScannedQRInternal called with:', { customer_id, qr_data });

      // Validate customer exists
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('user_id', customer_id)
        .single();

      console.log('Customer lookup:', { customer, customerError });

      if (customerError || !customer) {
        console.error('Customer not found:', customerError);
        return sendError(res, 'Customer not found', 404);
      }

      if (customer.role !== 'customer') {
        console.error('User is not a customer:', customer.role);
        return sendError(res, 'User is not a customer', 403);
      }

      // Check if transaction already exists (prevent duplicate)
      // Validate reference number format
      if (!REFERENCE_REGEX.test(qr_data.reference_number)) {
        return sendError(res, 'Invalid reference number format', 400);
      }
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference_number', qr_data.reference_number)
        .limit(1);

      if (existingTransaction && existingTransaction.length > 0) {
        return sendError(res, 'Transaction already processed', 400);
      }

      // Insert transaction rows (one per item)
      const transactionRows = qr_data.items.map(item => ({
        reference_number: qr_data.reference_number,
        transaction_date: qr_data.transaction_date,
        user_id: customer_id,
        Vendor_ID: qr_data.vendor_id,
        store_id: qr_data.store_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        points: parseFloat((item.price * item.quantity * 0.1).toFixed(2)),
        transaction_type: qr_data.transaction_type
      }));

      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionRows)
        .select();

      if (transactionError) {
        console.error('Transaction insert error:', transactionError);
        return sendError(res, transactionError.message, 400);
      }

      // Get current user points
      const { data: userData } = await supabase
        .from('users')
        .select('user_points')
        .eq('user_id', customer_id)
        .single();

      const currentPoints = userData?.user_points || 0;
      const newPoints = currentPoints + qr_data.total_points;

      // Update customer points
      const { error: pointsError } = await supabase
        .from('users')
        .update({ user_points: newPoints })
        .eq('user_id', customer_id);

      if (pointsError) {
        console.error('Points update error:', pointsError);
      }

      // Mark pending transaction as used in database
      if (pendingId) {
        await supabase
          .from('pending_transactions')
          .update({ used: true })
          .eq('id', pendingId);
        console.log('Marked pending transaction as used:', pendingId);
      }

      // Remove from pending transactions if it was a manual code entry
      if (qr_data.short_code && global.pendingTransactions) {
        global.pendingTransactions.delete(qr_data.short_code);
      }

      return sendSuccess(res, {
        message: 'Transaction processed successfully',
        transaction: {
          reference_number: qr_data.reference_number,
          total_amount: qr_data.total_amount,
          total_points: qr_data.total_points,
          items_count: transactions.length
        }
      }, 201);
    } catch (error) {
      console.error('Error in processScannedQRInternal:', error);
      console.error('Error stack:', error.stack);
      return sendError(res, `Internal server error: ${error.message}`, 500);
    }
  }

  // PURCHASE PRODUCT with points
  async purchaseProduct(req, res) {
    try {
      const { userId, productId, storeId, pointsCost, quantity } = req.body;

      console.log('=== PURCHASE PRODUCT ===');
      console.log('Request body:', { userId, productId, storeId, pointsCost, quantity });

      // Validate input
      if (!userId || !productId || !storeId || !pointsCost || !quantity) {
        return sendError(res, 'Missing required fields: userId, productId, storeId, pointsCost, quantity', 400);
      }

      // Get product details
      console.log('Fetching product:', productId);
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (productError || !product) {
        console.error('Product not found');
        return sendError(res, 'Product not found', 404);
      }

      console.log('Product found:', product.product_name);

      // Get user details and current points
      console.log('Fetching user:', userId);
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('user_points')
        .eq('user_id', userId)
        .single();

      if (userError || !user) {
        console.error('User not found');
        return sendError(res, 'User not found', 404);
      }

      const currentPoints = user.user_points || 0;
      console.log('Current points:', currentPoints, 'Cost:', pointsCost);

      // Check if user has enough points
      if (currentPoints < pointsCost) {
        console.error('Insufficient points:', { currentPoints, pointsCost });
        return sendError(res, `Insufficient points. You have ${currentPoints}, need ${pointsCost}`, 400);
      }

      // Generate reference number for this purchase
      const referenceNumber = generateReferenceNumber(new Date(), product.store_id);
      console.log('Generated reference number:', referenceNumber);

      // Create transaction record
      console.log('Creating transaction record...');
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          Vendor_ID: product.vendor_id,
          store_id: storeId,
          product_id: productId,
          quantity: quantity,
          price: product.price,
          points: pointsCost,
          reference_number: referenceNumber,
          transaction_type: 'purchase',
          transaction_date: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return sendError(res, 'Failed to create transaction', 500, transactionError.message);
      }

      console.log('Transaction created:', transaction);

      // Deduct points from user
      const newPoints = currentPoints - pointsCost;
      console.log('Deducting points. New balance:', newPoints);

      const { error: updateError } = await supabase
        .from('users')
        .update({ user_points: newPoints })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user points:', updateError);
        // Rollback transaction if points update fails
        await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id);
        return sendError(res, 'Failed to deduct points', 500);
      }

      console.log('Points deducted successfully. New balance:', newPoints);

      return sendSuccess(res, {
        message: 'Product purchased successfully',
        transaction,
        remainingPoints: newPoints,
        referenceNumber: referenceNumber
      }, 200);

    } catch (error) {
      console.error('Error in purchaseProduct:', error);
      console.error('Error stack:', error.stack);
      return sendError(res, `Internal server error: ${error.message}`, 500);
    }
  }
}

module.exports = new TransactionController();
