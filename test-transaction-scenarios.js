const { supabase } = require('./supabaseClient');
const http = require('http');

// Test configuration - Update these with your actual IDs
const TEST_CONFIG = {
  customer_id: 4, // Customer: kyleangeloalmario@lpubatangas.edu.ph
  vendor_id: 2,   // Vendor/Owner of Supreme Bowl store
  store_id: 1,    // Supreme Bowl
  product_id: 2,  // Bacon product
  reward_id: 1,   // Defense Promo reward
};

// Helper to generate short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper to generate reference number (Format: XXXX-YYYYMMDD-####)
function generateReference() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TEST-${datePart}-${random}`;
}

// Helper to create pending transaction
async function createPendingTransaction(data) {
  const { data: pending, error } = await supabase
    .from('pending_transactions')
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating pending transaction:', error);
    return null;
  }
  return pending;
}

// Helper to make API call using http module
function processTransaction(qrCode) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      customer_id: TEST_CONFIG.customer_id,
      short_code: qrCode
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/transactions/process-code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { message: data } });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Test Scenario 1: Pure Redemption (Code-Only Redemption)
async function testPureRedemption() {
  console.log('\n========================================');
  console.log('TEST 1: PURE REDEMPTION (Code-Only)');
  console.log('========================================');
  
  const customerCode = generateShortCode();
  const vendorCode = generateShortCode();
  
  // Step 1: Create customer's pending transaction with cart items
  console.log('\n1. Creating customer redemption code with cart items...');
  const customerPending = await createPendingTransaction({
    short_code: customerCode,
    reference_number: generateReference(),
    transaction_data: {
      user_id: TEST_CONFIG.customer_id,
      store_id: TEST_CONFIG.store_id,
      owner_id: TEST_CONFIG.vendor_id,
      total_points: 500, // Total for entire cart
      is_cart: true,
      items: [
        { product_id: TEST_CONFIG.product_id, product_name: 'Product 1', quantity: 2, price: 150 },
        { product_id: TEST_CONFIG.product_id + 1, product_name: 'Product 2', quantity: 1, price: 200 }
      ]
    },
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!customerPending) {
    console.error('❌ Failed to create customer pending transaction');
    return;
  }
  console.log('✅ Customer code created:', customerCode);
  
  // Step 2: Create vendor's QR code (vendor validates customer's code)
  console.log('\n2. Creating vendor QR code with customer redemption code...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [], // Empty for code-only redemption
      has_redemptions: true,
      redemption_code: customerCode,
      transaction_type: 'Redemption'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR code created:', vendorCode);
  
  // Step 3: Customer scans vendor's QR code
  console.log('\n3. Customer scanning vendor QR code...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Reference:', result.data.data?.reference_number || 'N/A');
    console.log('Expected: -500 points deducted');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Test Scenario 2: Redemption + Reward
async function testRedemptionWithReward() {
  console.log('\n========================================');
  console.log('TEST 2: REDEMPTION + REWARD');
  console.log('========================================');
  
  const customerCode = generateShortCode();
  const vendorCode = generateShortCode();
  
  // Step 1: Create customer's redemption code
  console.log('\n1. Creating customer redemption code...');
  const customerPending = await createPendingTransaction({
    short_code: customerCode,
    reference_number: generateReference(),
    transaction_data: {
      user_id: TEST_CONFIG.customer_id,
      store_id: TEST_CONFIG.store_id,
      owner_id: TEST_CONFIG.vendor_id,
      total_points: 300,
      is_cart: true,
      items: [
        { product_id: TEST_CONFIG.product_id, product_name: 'Redeemed Item', quantity: 1, price: 180 }
      ]
    },
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!customerPending) {
    console.error('❌ Failed to create customer pending transaction');
    return;
  }
  console.log('✅ Customer code created:', customerCode);
  
  // Step 2: Create vendor's QR with redemption + reward
  console.log('\n2. Creating vendor QR with redemption and reward...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [], // Empty since it's code-only
      has_redemptions: true,
      redemption_code: customerCode,
      reward_id: TEST_CONFIG.reward_id,
      reward_type: 'discount',
      discount_value: 10, // 10% discount
      reward_points: 50, // Bonus points for using reward
      transaction_type: 'Redemption'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR created:', vendorCode);
  
  // Step 3: Process transaction
  console.log('\n3. Processing transaction...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Expected: -300 points (redemption) + 50 points (reward) = -250 net');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Test Scenario 3: Redemption + Purchase
async function testRedemptionWithPurchase() {
  console.log('\n========================================');
  console.log('TEST 3: REDEMPTION + PURCHASE');
  console.log('========================================');
  
  const customerCode = generateShortCode();
  const vendorCode = generateShortCode();
  
  // Step 1: Create customer's redemption code
  console.log('\n1. Creating customer redemption code...');
  const customerPending = await createPendingTransaction({
    short_code: customerCode,
    reference_number: generateReference(),
    transaction_data: {
      user_id: TEST_CONFIG.customer_id,
      store_id: TEST_CONFIG.store_id,
      owner_id: TEST_CONFIG.vendor_id,
      total_points: 200,
      is_cart: true,
      items: [
        { product_id: TEST_CONFIG.product_id, product_name: 'Redeemed Item', quantity: 1, price: 120 }
      ]
    },
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!customerPending) {
    console.error('❌ Failed to create customer pending transaction');
    return;
  }
  console.log('✅ Customer code created:', customerCode);
  
  // Step 2: Create vendor's QR with redemption + purchase items
  console.log('\n2. Creating vendor QR with redemption and purchase items...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [
        // Purchase items (regular items in cart)
        { product_id: TEST_CONFIG.product_id + 2, product_name: 'Purchase Item 1', quantity: 1, price: 100, is_redemption: false },
        { product_id: TEST_CONFIG.product_id + 3, product_name: 'Purchase Item 2', quantity: 2, price: 50, is_redemption: false }
      ],
      has_redemptions: true,
      redemption_code: customerCode,
      transaction_type: 'Purchase'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR created:', vendorCode);
  
  // Step 3: Process transaction
  console.log('\n3. Processing transaction...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Expected: -200 (redemption) + 20 (10% of 200 purchase) = -180 net points');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Test Scenario 4: Redemption + Purchase + Reward
async function testRedemptionPurchaseReward() {
  console.log('\n========================================');
  console.log('TEST 4: REDEMPTION + PURCHASE + REWARD');
  console.log('========================================');
  
  const customerCode = generateShortCode();
  const vendorCode = generateShortCode();
  
  // Step 1: Create customer's redemption code
  console.log('\n1. Creating customer redemption code...');
  const customerPending = await createPendingTransaction({
    short_code: customerCode,
    reference_number: generateReference(),
    transaction_data: {
      user_id: TEST_CONFIG.customer_id,
      store_id: TEST_CONFIG.store_id,
      owner_id: TEST_CONFIG.vendor_id,
      total_points: 250,
      is_cart: true,
      items: [
        { product_id: TEST_CONFIG.product_id, product_name: 'Redeemed Item', quantity: 1, price: 150 }
      ]
    },
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!customerPending) {
    console.error('❌ Failed to create customer pending transaction');
    return;
  }
  console.log('✅ Customer code created:', customerCode);
  
  // Step 2: Create vendor's QR with everything
  console.log('\n2. Creating vendor QR with redemption, purchase, and reward...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [
        { product_id: TEST_CONFIG.product_id + 4, product_name: 'Purchase Item', quantity: 1, price: 200, is_redemption: false }
      ],
      has_redemptions: true,
      redemption_code: customerCode,
      reward_id: TEST_CONFIG.reward_id,
      reward_type: 'discount',
      discount_value: 15, // 15% discount on purchase
      reward_points: 30,
      transaction_type: 'Purchase'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR created:', vendorCode);
  
  // Step 3: Process transaction
  console.log('\n3. Processing transaction...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Expected: -250 (redemption) + 17 (10% of 170 discounted purchase) + 30 (reward) = -203 net');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Test Scenario 5: Reward + Purchase
async function testRewardWithPurchase() {
  console.log('\n========================================');
  console.log('TEST 5: REWARD + PURCHASE');
  console.log('========================================');
  
  const vendorCode = generateShortCode();
  
  console.log('\n1. Creating vendor QR with purchase and reward...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [
        { product_id: TEST_CONFIG.product_id, product_name: 'Purchase Item 1', quantity: 2, price: 100, is_redemption: false },
        { product_id: TEST_CONFIG.product_id + 1, product_name: 'Purchase Item 2', quantity: 1, price: 150, is_redemption: false }
      ],
      has_redemptions: false,
      reward_id: TEST_CONFIG.reward_id,
      reward_type: 'discount',
      discount_value: 20, // 20% discount
      reward_points: 40,
      transaction_type: 'Purchase'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR created:', vendorCode);
  
  // Step 2: Process transaction
  console.log('\n2. Customer scanning QR...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Expected: +28 (10% of 280 discounted purchase) + 40 (reward) = +68 points');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Test Scenario 6: Pure Reward (Free Item)
async function testPureReward() {
  console.log('\n========================================');
  console.log('TEST 6: PURE REWARD (Free Item)');
  console.log('========================================');
  
  const vendorCode = generateShortCode();
  
  console.log('\n1. Creating vendor QR with free item reward...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [],
      has_redemptions: false,
      reward_id: TEST_CONFIG.reward_id,
      reward_type: 'free_item',
      free_item_product_id: TEST_CONFIG.product_id,
      reward_points: 50, // Bonus points for claiming free item
      transaction_type: 'Reward'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR created:', vendorCode);
  
  // Step 2: Process transaction
  console.log('\n2. Customer claiming free item...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Expected: +50 points (reward bonus)');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Test Scenario 7: Pure Purchase
async function testPurePurchase() {
  console.log('\n========================================');
  console.log('TEST 7: PURE PURCHASE');
  console.log('========================================');
  
  const vendorCode = generateShortCode();
  
  console.log('\n1. Creating vendor QR with purchase items only...');
  const vendorPending = await createPendingTransaction({
    short_code: vendorCode,
    reference_number: generateReference(),
    transaction_data: {
      vendor_id: TEST_CONFIG.vendor_id,
      store_id: TEST_CONFIG.store_id,
      items: [
        { product_id: TEST_CONFIG.product_id, product_name: 'Purchase Item 1', quantity: 1, price: 120, is_redemption: false },
        { product_id: TEST_CONFIG.product_id + 1, product_name: 'Purchase Item 2', quantity: 3, price: 80, is_redemption: false }
      ],
      has_redemptions: false,
      transaction_type: 'Purchase'
    },
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false
  });
  
  if (!vendorPending) {
    console.error('❌ Failed to create vendor pending transaction');
    return;
  }
  console.log('✅ Vendor QR created:', vendorCode);
  
  // Step 2: Process transaction
  console.log('\n2. Customer scanning QR...');
  const result = await processTransaction(vendorCode);
  
  if (result.status === 200 || result.data.message === 'Transaction processed successfully') {
    console.log('✅ Transaction successful!');
    console.log('Expected: +36 points (10% of 360 total purchase)');
  } else {
    console.log('❌ Transaction failed:', result.data.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TRANSACTION SCENARIOS TEST SUITE      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\nConfiguration:');
  console.log('- Customer ID:', TEST_CONFIG.customer_id);
  console.log('- Vendor ID:', TEST_CONFIG.vendor_id);
  console.log('- Store ID:', TEST_CONFIG.store_id);
  console.log('- Product ID:', TEST_CONFIG.product_id);
  console.log('- Reward ID:', TEST_CONFIG.reward_id);
  console.log('\n⚠️  Make sure your server is running on http://localhost:3000');
  console.log('⚠️  Update TEST_CONFIG with your actual database IDs\n');
  
  try {
    await testPureRedemption();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testRedemptionWithReward();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testRedemptionWithPurchase();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testRedemptionPurchaseReward();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testRewardWithPurchase();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPureReward();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPurePurchase();
    
    console.log('\n========================================');
    console.log('ALL TESTS COMPLETED');
    console.log('========================================\n');
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

// Run the tests
runAllTests();
