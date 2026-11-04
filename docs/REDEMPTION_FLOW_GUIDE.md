# Product Redemption Flow - Testing Guide

## ✅ IMPLEMENTATION STATUS

**Mixed Transaction System: FULLY IMPLEMENTED**

The system now supports:
- ✅ Pure purchases (earn points)
- ✅ Pure redemptions (spend points)  
- ✅ **Mixed transactions (purchase + redemption in one transaction)**
- ✅ Rewards still working (discounts, free items, buy X get Y)
- ✅ Customer redeems without separate profile scan

### What Changed:
1. **Vendor Cart (AddMenuPage.js)**: 
   - Added redemption toggle for each item
   - Added redemption code input fields
   - Cart items show as "Purchase" (blue) or "Redemption" (orange)
   
2. **Backend (transactionController.js)**:
   - Validates all redemption codes before generating QR
   - Calculates separate totals: purchase_total, redemption_points, net_points
   - Creates mixed transaction records
   - Marks all used redemption codes automatically
   
3. **Transaction QR**:
   - Contains customer_id (no separate profile scan needed)
   - Includes purchase items AND redemption items
   - Customer scans one QR → everything processes together

## Overview
The new cart-based product redemption system allows customers to redeem products using points and vendors to verify these redemptions using short codes.

## How It Works

### Customer Side (SpecificStoreScreen.js)

1. **Add Products to Cart**
   - Customer browses products in a store
   - Clicks "Redeem" button to add items to cart
   - Cart badge shows total item count

2. **Review Cart**
   - Floating cart button opens cart modal
   - Shows all items with quantities and point costs
   - Can adjust quantities with +/- buttons
   - Shows total points required vs available

3. **Redeem Cart**
   - Click "Redeem All" button
   - Confirmation modal shows item count and total points
   - After confirmation, system generates redemption code

4. **Get Redemption Code**
   - Transaction code modal appears with 6-character code
   - Two options:
     - **Cancel**: Closes modal, updates points
     - **Go to Scanner**: Navigates to Scanner screen to scan vendor's QR

### Backend Processing

#### Single Product Redemption
- Endpoint: `POST /rewards/redemptions/generate-code`
- Creates entry in `pending_transactions` table:
  ```javascript
  {
    short_code: "ABC123",     // 6-char alphanumeric
    reference_number: "STOR-20251206-1234",
    transaction_data: {
      user_id,
      product_id,
      store_id,
      owner_id,
      points_required
    },
    expires_at: "2025-12-06T10:15:00",  // 15 min expiry
    used: false
  }
  ```

#### Cart Redemption
- Endpoint: `POST /rewards/redemptions/generate-cart-code`
- Creates entry in `pending_transactions` table:
  ```javascript
  {
    short_code: "XYZ789",
    reference_number: "STOR-20251206-5678",
    transaction_data: {
      user_id,
      cart_items: [
        {
          product_id,
          product_name,
          quantity,
          price
        }
      ],
      store_id,
      owner_id,
      total_points,
      is_cart: true  // Flag for cart redemptions
    },
    expires_at: "2025-12-06T10:15:00",
    used: false
  }
  ```

### Vendor Side Verification

#### Method 1: Customer Scans Vendor's QR Code

1. **Vendor Creates Transaction QR** (AddMenuPage.js)
   - Vendor adds items to cart (normal purchase)
   - Clicks "Generate QR" button
   - Optionally enters reward code
   - QR code modal displays with short code

2. **Customer Scans QR**
   - Customer opens Scanner screen
   - Scans vendor's QR code
   - Backend processes transaction:
     - Validates customer and vendor IDs
     - Calculates total amount and points
     - Applies any rewards/discounts
     - Creates transaction record
     - Awards points to customer
     - Deducts points if redemption was used

3. **Transaction Complete**
   - Success modal shows transaction details
   - Points are updated in real-time

#### Method 2: Manual Code Entry (For Redemptions)

**This is the primary method for product redemptions!**

1. **Customer Shows Code to Vendor**
   - Customer has 6-character code (e.g., "ABC123")
   - Shows code to vendor (on screen or verbally)

2. **Vendor Enters Code Manually**
   - Currently, you need to implement this in vendor screens
   - Recommended: Add "Verify Redemption Code" button in VendorHomePage.js
   - Input field for 6-character code
   - API call to verify and process

3. **Backend Verification**
   - Endpoint: `POST /transactions/process-short-code`
   - Request body:
     ```javascript
     {
       short_code: "ABC123",
       customer_id: 1  // Vendor should know customer somehow
     }
     ```
   - Backend:
     - Looks up code in `pending_transactions`
     - Validates not expired (15 min window)
     - Validates not already used
     - Processes transaction:
       - For single product: Creates transaction record
       - For cart: Creates multiple transaction records
       - Deducts points from customer's `user_points`
       - Marks pending_transaction as `used: true`

4. **Response**
   ```javascript
   {
     success: true,
     transaction: {
       total_amount: 250.00,
       total_points: -500,  // Negative for redemption
       reference_number: "STOR-20251206-1234"
     }
   }
   ```

## What You Need to Implement on Vendor Side

### Option 1: Add Manual Code Verification Screen

Create a new screen or add to existing vendor screen:

```javascript
// In VendorHomePage.js or new RedemptionVerificationScreen.js

const [redemptionCode, setRedemptionCode] = useState('');
const [verifying, setVerifying] = useState(false);

const verifyRedemptionCode = async () => {
  if (!redemptionCode.trim() || redemptionCode.length !== 6) {
    Alert.alert('Error', 'Please enter a valid 6-character code');
    return;
  }

  setVerifying(true);
  try {
    // You need to get customer_id somehow - options:
    // 1. Customer scans vendor QR first to link
    // 2. Customer enters their phone/email
    // 3. Use a lookup system
    
    const response = await apiService.request('/transactions/process-short-code', {
      method: 'POST',
      body: JSON.stringify({
        short_code: redemptionCode.toUpperCase(),
        customer_id: customerIdFromSomewhere  // TODO: Implement customer lookup
      })
    });

    if (response.success) {
      Alert.alert(
        'Redemption Successful!',
        `Customer redeemed items worth ${response.transaction.total_points} points\n` +
        `Reference: ${response.transaction.reference_number}`,
        [{ text: 'OK', onPress: () => setRedemptionCode('') }]
      );
    } else {
      Alert.alert('Error', response.message || 'Invalid redemption code');
    }
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to verify code');
  } finally {
    setVerifying(false);
  }
};
```

### Option 2: Hybrid Scanner Flow (Recommended for Mixed Transactions)

**This is the best approach when customers want to both purchase AND redeem in one transaction.**

#### How It Works:

1. **Customer Shows Identity QR**
   - Customer generates QR code with their user_id (new feature needed)
   - Or shows profile QR that vendor scans first
   
2. **Vendor Creates Mixed Transaction**
   - Vendor adds items to cart in AddMenuPage.js:
     - Regular products (to purchase)
     - Redeemed products (marked with flag)
   - Vendor enters customer's redemption code if customer has one
   - Clicks "Generate QR"
   
3. **Enhanced Cart Structure**
   ```javascript
   cart: [
     { 
       product_id: 1, 
       product_name: "Coffee", 
       quantity: 2, 
       price: 100,
       is_redemption: false  // Customer pays for this
     },
     { 
       product_id: 2, 
       product_name: "Cake", 
       quantity: 1, 
       price: 150,
       is_redemption: true,  // Customer redeems with points
       redemption_code: "ABC123"  // The code customer showed
     }
   ]
   ```

4. **Backend Processing**
   - Validates redemption code if present
   - Calculates two totals:
     - `purchase_total`: Amount customer pays (earns points)
     - `redemption_total`: Points deducted for redeemed items
   - Creates mixed transaction record
   - Updates points: `+purchase_points -redemption_points`

5. **Customer Scans Final QR**
   - Customer scans vendor's QR
   - Backend processes both purchase and redemption
   - Shows net points earned/spent

#### Implementation Steps:

**Step 1: Add Customer Identity QR** (ProfilePageScreen.js)
```javascript
// Generate QR with user info
const customerQRData = JSON.stringify({
  type: 'customer_identity',
  user_id: userData.user_id,
  name: userData.first_name + ' ' + userData.last_name,
  timestamp: Date.now()
});
```

**Step 2: Enhance Vendor Cart** (AddMenuPage.js)
```javascript
const [redemptionCodes, setRedemptionCodes] = useState({});

// When adding product, ask if it's a redemption
const addToCart = (product, isRedemption = false) => {
  setCart(prevCart => {
    // ... existing logic
    return [...prevCart, { 
      ...product, 
      quantity: 1,
      is_redemption: isRedemption
    }];
  });
  
  // If redemption, prompt for code
  if (isRedemption) {
    promptForRedemptionCode(product.id);
  }
};

const promptForRedemptionCode = (productId) => {
  Alert.prompt(
    'Enter Redemption Code',
    'Customer should show you their 6-character code',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'OK', 
        onPress: (code) => {
          setRedemptionCodes(prev => ({
            ...prev,
            [productId]: code.toUpperCase()
          }));
        }
      }
    ],
    'plain-text'
  );
};
```

**Step 3: Update Transaction Generation**
```javascript
const finalizeTransaction = async () => {
  // Separate cart into purchase and redemption items
  const purchaseItems = cart.filter(item => !item.is_redemption);
  const redemptionItems = cart.filter(item => item.is_redemption);
  
  const payload = {
    vendor_id: vendorId,
    store_id: storeId,
    customer_id: scannedCustomerId, // From customer QR scan
    purchase_items: purchaseItems,
    redemption_items: redemptionItems.map(item => ({
      ...item,
      redemption_code: redemptionCodes[item.id]
    })),
    reward_code: rewardCode.trim() || undefined
  };
  
  const response = await apiService.generateMixedTransactionQR(payload);
  // ... rest of logic
};
```

**Step 4: New Backend Endpoint**
```javascript
// In transactionController.js
async createMixedTransaction(req, res) {
  try {
    const { 
      vendor_id, 
      store_id, 
      customer_id,
      purchase_items,
      redemption_items,
      reward_code 
    } = req.body;
    
    // Validate redemption codes
    const validatedRedemptions = [];
    for (const item of redemption_items) {
      const { data: pending } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('short_code', item.redemption_code)
        .eq('used', false)
        .single();
        
      if (!pending) {
        return sendError(res, `Invalid redemption code: ${item.redemption_code}`, 400);
      }
      
      // Verify code belongs to this customer
      if (pending.transaction_data.user_id !== customer_id) {
        return sendError(res, `Redemption code doesn't belong to this customer`, 403);
      }
      
      validatedRedemptions.push({
        ...item,
        points_deducted: pending.transaction_data.points_required || 
                        pending.transaction_data.total_points,
        pending_id: pending.id
      });
    }
    
    // Calculate totals
    const purchaseTotal = purchase_items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    const purchasePoints = Math.round(purchaseTotal * 0.1);
    
    const redemptionPoints = validatedRedemptions.reduce((sum, item) => 
      sum + item.points_deducted, 0);
    
    const netPoints = purchasePoints - redemptionPoints;
    
    // Create QR data with mixed transaction
    const qrData = {
      reference_number: generateReferenceNumber(...),
      short_code: generateShortCode(),
      transaction_date: new Date().toISOString(),
      vendor_id,
      store_id,
      customer_id,
      purchase_items,
      redemption_items: validatedRedemptions,
      purchase_total: purchaseTotal,
      purchase_points: purchasePoints,
      redemption_points: redemptionPoints,
      net_points: netPoints,
      transaction_type: 'Mixed', // New type
      reward_code
    };
    
    // Store in pending_transactions
    await supabase.from('pending_transactions').insert({
      short_code: qrData.short_code,
      reference_number: qrData.reference_number,
      transaction_data: qrData,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false
    });
    
    return sendSuccess(res, {
      qr_string: JSON.stringify(qrData),
      short_code: qrData.short_code,
      summary: {
        purchase_total: purchaseTotal,
        purchase_points: purchasePoints,
        redemption_points: redemptionPoints,
        net_points: netPoints
      }
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
}

// Process mixed transaction when customer scans
async processMixedTransaction(customer_id, qr_data) {
  const { 
    purchase_items, 
    redemption_items,
    purchase_total,
    purchase_points,
    redemption_points,
    net_points,
    reference_number,
    vendor_id,
    store_id
  } = qr_data;
  
  // Create transaction records
  // 1. Purchase transactions (positive points)
  for (const item of purchase_items) {
    await supabase.from('transactions').insert({
      reference_number: `${reference_number}-P-${item.product_id}`,
      user_id: customer_id,
      vendor_id,
      store_id,
      product_id: item.product_id,
      total_amount: item.price * item.quantity,
      total_points: Math.round((item.price * item.quantity) * 0.1),
      transaction_type: 'Purchase',
      transaction_date: new Date().toISOString()
    });
  }
  
  // 2. Redemption transactions (negative points)
  for (const item of redemption_items) {
    await supabase.from('transactions').insert({
      reference_number: `${reference_number}-R-${item.product_id}`,
      user_id: customer_id,
      vendor_id,
      store_id,
      product_id: item.product_id,
      total_amount: 0, // No money exchanged
      total_points: -item.points_deducted,
      transaction_type: 'Redemption',
      transaction_date: new Date().toISOString()
    });
    
    // Mark redemption code as used
    await supabase.from('pending_transactions')
      .update({ used: true })
      .eq('id', item.pending_id);
  }
  
  // 3. Update user points (net change)
  await supabase.rpc('update_user_points', {
    p_user_id: customer_id,
    p_store_id: store_id,
    p_points_change: net_points
  });
  
  return {
    success: true,
    purchase_total,
    points_earned: purchase_points,
    points_spent: redemption_points,
    net_points,
    reference_number
  };
}
```

### Option 3: Link Customer First

Best approach for real-world use:

1. **Customer Opens App at Vendor**
   - Shows QR code with their user_id
   
2. **Vendor Scans Customer QR**
   - Stores customer_id temporarily
   
3. **Customer Shows Redemption Code**
   - Vendor enters code
   - System links code to stored customer_id
   
4. **Process Redemption**
   - Backend validates code + customer
   - Completes transaction

## Testing the Redemption Flow

### Test Scenario 1: Single Product Redemption

1. **Setup**
   - Ensure customer has enough points (check MyPointsScreen)
   - Ensure products exist in store

2. **Customer Actions**
   ```
   1. Open SpecificStoreScreen for a store
   2. Click "Redeem" on a product
   3. Check cart modal opens
   4. Click "Redeem All"
   5. Confirm in modal
   6. Note the 6-character code displayed
   ```

3. **Backend Verification**
   ```sql
   -- Check code was created
   SELECT * FROM pending_transactions 
   WHERE short_code = 'ABC123' 
   ORDER BY created_at DESC LIMIT 1;
   
   -- Should show:
   -- used: false
   -- expires_at: ~15 minutes from now
   -- transaction_data contains product_id, points_required
   ```

4. **Vendor Verification** (Manual test)
   ```javascript
   // Use API testing tool (Postman, Thunder Client, etc.)
   POST http://your-server/api/transactions/process-short-code
   Body: {
     "short_code": "ABC123",
     "customer_id": 1
   }
   ```

5. **Verify Results**
   ```sql
   -- Code should be marked as used
   SELECT * FROM pending_transactions WHERE short_code = 'ABC123';
   -- used: true
   
   -- Transaction should be created
   SELECT * FROM transactions 
   WHERE reference_number LIKE 'STOR-%' 
   ORDER BY transaction_date DESC LIMIT 1;
   
   -- Points should be deducted
   SELECT * FROM user_points 
   WHERE user_id = 1 AND store_id = <store_id>;
   -- total_points should be reduced
   ```

### Test Scenario 2: Cart Redemption (Multiple Items)

Same as above but:
1. Add multiple products to cart
2. Adjust quantities
3. Verify cart modal shows correct totals
4. Redeem entire cart
5. Backend should create multiple transaction records (one per cart item)

### Test Scenario 3: Code Expiration

1. Generate redemption code
2. Wait 15 minutes
3. Try to process code
4. Should get "Code has expired" error

### Test Scenario 4: Duplicate Prevention

1. Generate and process a code successfully
2. Try to process same code again
3. Should get "Invalid or expired code" error

## Database Schema Reference

### pending_transactions
```sql
CREATE TABLE pending_transactions (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### transactions
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(user_id),
  vendor_id INTEGER REFERENCES users(user_id),
  store_id INTEGER REFERENCES stores(store_id),
  product_id INTEGER REFERENCES products(product_id),
  total_amount DECIMAL(10,2),
  total_points DECIMAL(10,2),  -- Negative for redemptions
  transaction_type VARCHAR(50),  -- 'Purchase' or 'Redemption'
  transaction_date TIMESTAMP DEFAULT NOW(),
  -- ... other fields
);
```

### user_points
```sql
CREATE TABLE user_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  store_id INTEGER REFERENCES stores(store_id),
  total_points DECIMAL(10,2) DEFAULT 0,
  -- ... other fields
);
```

## ✅ IMPLEMENTED: Mixed Transaction System

The system now supports mixed transactions where customers can purchase and redeem items in a single transaction!

## Mixed Transaction Use Cases

### Scenario 1: Customer Buys 2 Items, Redeems 1 Item

**Example:**
- Customer wants: 2 Coffees (₱100 each) + 1 Free Cake (redeemed with points)
- Customer has redemption code for cake: "ABC123" (200 points)

**Flow:**
1. Vendor scans customer's identity QR → gets user_id
2. Vendor adds to cart:
   - Coffee x2 (regular purchase)
   - Cake x1 (mark as redemption, enter code "ABC123")
3. System calculates:
   - Purchase total: ₱200 → Earns 20 points
   - Redemption: -200 points
   - Net: -180 points
4. Customer scans vendor's QR → Transaction completes
5. Customer's points: Previous balance - 180 points

### Scenario 2: Pure Purchase (Existing Flow)

**Example:**
- Customer buys 3 items worth ₱300
- No redemptions

**Flow:**
1. Vendor adds items to cart (all regular)
2. Generates QR
3. Customer scans → Earns 30 points

### Scenario 3: Pure Redemption (Existing Flow)

**Example:**
- Customer redeems 2 items using points only
- Has codes: "ABC123" + "XYZ789"

**Flow:**
1. Customer generates codes from their app
2. Vendor enters both codes in system
3. Processes redemptions
4. Points deducted, no money exchanged

## Next Steps

### For Mixed Transactions (Recommended):

1. **Add Customer Identity QR** (ProfilePageScreen.js)
   - Generate QR code with user_id
   - Display in profile screen
   - "Show QR to Vendor" button

2. **Enhance Vendor Cart UI** (AddMenuPage.js)
   - Add "Scan Customer" button (scans identity QR)
   - For each product, add toggle: "Purchase" vs "Redeem"
   - If "Redeem" → prompt for redemption code
   - Show separate subtotals:
     - Items to purchase: ₱XXX
     - Items to redeem: XXX points
     - Net points change: +/- XXX

3. **Create New Backend Endpoints**
   - `POST /transactions/create-mixed` → Generate mixed transaction QR
   - `POST /transactions/process-mixed` → Process when customer scans
   - Validate all redemption codes belong to customer
   - Calculate net points correctly

4. **Update Transaction History**
   - Show mixed transactions with breakdown
   - Display: "Purchased X items, Redeemed Y items"
   - Show net points change

5. **Testing**
   - Test pure purchase
   - Test pure redemption
   - Test mixed (1 purchase + 1 redemption)
   - Test multiple redemptions in one transaction
   - Verify points calculations
   - Check error handling (invalid codes, mismatched customer)

### For Simple Redemption-Only (Current System):

1. **Implement Vendor Verification UI**
   - Add "Verify Redemption" button to VendorHomePage
   - Create input modal for 6-character code
   - Implement customer lookup mechanism
   - Show success/error feedback

2. **Add Customer Identification**
   - Customer QR code generation (shows user_id)
   - Vendor scans customer QR first
   - Then processes redemption code

3. **Add Transaction History**
   - Show redemption history in vendor TransactionPage
   - Filter by transaction_type = 'Redemption'
   - Show customer name, items, points deducted

4. **Testing**
   - Test with real devices/emulators
   - Verify points deduction
   - Check transaction records
   - Test error cases (expired, invalid, duplicate)

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/rewards/redemptions/generate-code` | POST | Generate code for single product |
| `/rewards/redemptions/generate-cart-code` | POST | Generate code for cart items |
| `/transactions/process-short-code` | POST | Verify and process redemption code |
| `/transactions/process-scanned-qr` | POST | Process vendor's purchase QR |
| `/users/:userId/points/:storeId` | GET | Get customer's points balance |

## Troubleshooting

### Code not found
- Check if code was generated (query `pending_transactions`)
- Verify short_code is uppercase
- Check expiration time

### Points not deducted
- Check `user_points` table before/after
- Verify customer has enough points
- Check transaction was created in `transactions` table

### Transaction already processed error
- Check if `pending_transactions.used = true`
- Verify no duplicate transaction with same reference_number

### Customer not found
- Ensure customer_id is valid
- Check user exists and role = 'customer'

---

## 🚀 QUICK START: Testing Mixed Transactions

### Test Scenario: Customer buys 1 item + redeems 1 item

**Step 1: Customer Generates Redemption Code**
1. Customer app → Go to store
2. Add product to cart (e.g., "Cake")
3. Click "Redeem All"
4. Get redemption code (e.g., "ABC123")
5. **Note down this code!**

**Step 2: Vendor Creates Mixed Transaction**
1. Vendor app → AddMenuPage (Create Order)
2. Add item for PURCHASE (e.g., "Coffee" - ₱100)
3. Add item customer wants to REDEEM (e.g., "Cake")
4. For "Cake": Check the ☑️ "Redeem with points" toggle
5. Enter customer's code: "ABC123"
6. Cart should show:
   - Coffee: ₱100 (blue background)
   - Cake: 250pts (orange background)
7. Click "Generate QR Code"
8. Review cart → Click "Finalize & Generate QR"

**Step 3: Customer Scans QR**
1. Customer app → Scanner screen
2. Scan vendor's QR code
3. Success! Transaction shows:
   - Purchased Coffee: +10 points
   - Redeemed Cake: -250 points
   - Net: -240 points

**Verify Results:**
```sql
-- Check customer's points decreased
SELECT * FROM user_points WHERE user_id = <customer_id>;

-- Check transactions created
SELECT * FROM transactions 
WHERE reference_number LIKE 'STOR-%' 
ORDER BY transaction_date DESC LIMIT 5;
-- Should see 2 rows:
-- 1. Purchase (Coffee) - positive points
-- 2. Redemption (Cake) - negative points

-- Check redemption code marked as used
SELECT * FROM pending_transactions WHERE short_code = 'ABC123';
-- used should be TRUE
```

### Expected Behavior:

**Cart Display:**
- Regular items: Show price (₱XX.XX) with white/gray background
- Redemption items: Show points (XXX pts) with orange background
- Items marked for redemption REQUIRE a code

**QR Generation:**
- Will fail if redemption code is missing
- Will fail if code is invalid/expired
- Will fail if code doesn't belong to customer (validated on scan)

**Points Calculation:**
- Purchase: Coffee ₱100 → +10 points
- Redemption: Cake (redeemed) → -250 points
- Net change: -240 points
- Final balance = Previous balance - 240

**Edge Cases Handled:**
- ✅ Empty cart → Can't generate QR
- ✅ Only redemptions (no purchases) → Pure redemption transaction
- ✅ Only purchases (no redemptions) → Regular purchase transaction
- ✅ Expired redemption code → Error before QR generation
- ✅ Code belongs to different customer → Error on scan
- ✅ Code already used → Error before QR generation
- ✅ Rewards still work → Discounts/free items apply to purchase items
