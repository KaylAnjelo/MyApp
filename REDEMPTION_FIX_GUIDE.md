# Points Redemption Fix - Complete Guide

## What Was Fixed

### Backend Issue (controllers/redemptionController.js)
The redemption controller was looking for points in the wrong table:
- ❌ **Was checking**: `user_points` table (wrong)
- ✅ **Now checks**: `users.user_points` column (correct)

This mismatch meant:
- Points validation failed silently
- Database updates never happened
- Frontend received success but saw no points deducted

### Frontend Issue (customer_screens/SpecificStoreScreen.js)
The response data wasn't being extracted correctly:
- ❌ **Was looking for**: `response.remainingPoints` (wrong level)
- ✅ **Now looks for**: `response.data.remainingPoints` (correct)

Plus added:
- Response success validation: `if (!response.success)` 
- Error logging to trace the flow
- Fallback for alternate response formats

## Files Modified
1. `controllers/redemptionController.js` - Fixed DB queries (3 changes)
2. `customer_screens/SpecificStoreScreen.js` - Fixed response extraction (1 change)

## Testing Procedure

### Step 1: Restart the Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
# OR
node server.js
```

### Step 2: Create Test Scenario
1. **Log in as a customer** with points (create if needed)
2. **Navigate to a store** with rewards available
3. **Check your points** - should display in the UI
4. **Find a reward** you can afford (e.g., need 100 points, you have 500)

### Step 3: Redeem a Reward
1. Click the green "Redeem" button
2. You should see a "Success!" alert
3. **Verify in UI:**
   - Points updated (500 → 400)
   - Reward marked as "Redeemed" 
   - Alert shows the reward details

### Step 4: Verify Database
Check that points were actually deducted:

```sql
-- Query the users table
SELECT user_id, user_points FROM users WHERE user_id = 'YOUR_USER_ID';
-- Should show: 400 (if started with 500)

-- Query the redemptions table  
SELECT * FROM redemptions WHERE customer_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;
-- Should show a record with status='pending'
```

### Step 5: Check Server Logs
In the terminal where server is running, look for output like:

```
=== REDEEM REWARD ===
Customer points: 500 Required: 100
Deducting points: 500 - 100 = 400
Points updated successfully. New balance: 400
```

## Expected Flow

```
Frontend: Click "Redeem" button
    ↓
Frontend: Call apiService.redeemReward()
    ↓
Backend: POST /rewards/redeem
    ↓
Backend: Check user has 500 points ✓
    ↓
Backend: Create redemption record ✓
    ↓
Backend: Deduct 100 points from users.user_points
    ✓ Now queries users table (not user_points table)
    ↓
Backend: Return { success: true, data: { remainingPoints: 400 } }
    ↓
Frontend: Extract response.data.remainingPoints
    ✓ Now uses correct response path
    ↓
Frontend: Update UI with new points (400)
    ↓
Frontend: Show success alert
```

## Troubleshooting

### Issue: "Insufficient points" error (but you have enough)
- **Cause**: User record might not have `user_points` column set
- **Fix**: Manually update: `UPDATE users SET user_points = 500 WHERE user_id = '...'`

### Issue: Redemption button doesn't respond
- **Cause**: Reward might not have `points_required` field set
- **Fix**: Check rewards table has `points_required` > 0

### Issue: Points not updating in UI
- **Cause**: Response structure mismatch (shouldn't happen now)
- **Fix**: Check browser console for error messages

### Issue: Backend shows error in logs
- **Examples & fixes**:
  ```
  Error creating redemption: UNIQUE constraint failed
    → Reward already redeemed by user
    
  Error updating user points: Column not found
    → Check users table has user_points column
    
  Reward not found or inactive
    → Check reward exists and is_active = true
  ```

## Quick Verification Checklist
- [ ] Server restarted successfully
- [ ] Log in as customer with points
- [ ] Navigate to store with active rewards
- [ ] Points display in UI
- [ ] Click "Redeem" on 100-point reward
- [ ] Success alert appears
- [ ] Points decrease (500 → 400)
- [ ] Reward shows "Redeemed"
- [ ] Check DB: points updated
- [ ] Check server logs: no errors

## Notes
- OTP storage is in-memory (not persistent across restarts)
- Reference number format: `STORE-YYYYMMDD-####`
- Transaction codes valid for 10 minutes
- Pending transactions stored in `pending_transactions` table
- This fix aligns all systems to use `users.user_points` as source of truth for customer points
