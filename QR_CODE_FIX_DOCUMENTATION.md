# QR Code "Invalid Code" Issue - Root Cause & Fix

## 🔴 THE PROBLEM

Your QR codes were showing as "valid for 10 mins" on the vendor side, but when customers tried to enter the code manually, they received an "invalid code" error.

### Root Cause

The short codes were being stored **only in volatile memory** (`global.pendingTransactions` Map) on the backend server. This meant:

1. **Server Restart Loss**: If the server restarted, all pending transaction codes were lost
2. **No Persistence**: The codes existed only as a JavaScript Map in RAM - not in any database
3. **Multi-Instance Problem**: If you had multiple server instances, a code generated on one instance might be looked up on another instance that doesn't have it
4. **Session-based Only**: The codes only worked during that specific server runtime session

### What Was Happening

1. Vendor generates QR → Code stored in `global.pendingTransactions` Map
2. Code gets printed with "Valid for 10 mins" 
3. Customer waits a moment (or server processes many requests)
4. Customer tries to enter code manually
5. Backend looks in the Map, which is empty or doesn't have the code
6. Error: "Invalid or expired code"

## ✅ THE SOLUTION

### Changes Made

#### 1. **New Database Table** (`migrations/create_pending_transactions_table.sql`)
Created a persistent `pending_transactions` table to store:
- `short_code`: The 6-digit code
- `reference_number`: Transaction reference
- `transaction_data`: The full QR data (JSONB)
- `expires_at`: When the code expires
- `used`: Boolean flag (prevents double-use)
- Indexes for fast lookups

#### 2. **Updated Transaction Controller** (`controllers/transactionController.js`)

**In `createTransaction()` method:**
- Now stores transaction data to `pending_transactions` table in Supabase
- Falls back to in-memory storage if database insert fails
- Sets expiry to 10 minutes from code generation

**In `processShortCode()` method:**
- **First checks the database** for the short code
- Falls back to in-memory cache for older codes
- Checks expiry time (handles both DB timestamps and in-memory expiry)
- Marks code as `used: true` in database to prevent double-use
- Provides better logging to track where code was found

**In `processScannedQRInternal()` method:**
- Now accepts optional `pendingId` parameter
- Marks pending transaction as `used: true` in database after successful processing
- Cleans up both database and in-memory cache

### How It Works Now

```
Vendor generates QR
  ↓
Code stored in: Supabase database + in-memory cache
  ↓
Code displayed to customer: "Valid for 10 mins"
  ↓
Customer enters code manually (even if server restarts!)
  ↓
Backend checks database first: ✓ Found!
  ↓
Backend verifies expiry time: ✓ Not expired!
  ↓
Backend processes transaction: ✓ Success!
  ↓
Backend marks code as used: ✓ Prevents double-use!
```

## 📋 IMPLEMENTATION STEPS

### Step 1: Run the Database Migration

Execute this SQL in your Supabase dashboard:

```sql
CREATE TABLE IF NOT EXISTS public.pending_transactions (
  id SERIAL NOT NULL,
  short_code CHARACTER VARYING(20) NOT NULL,
  reference_number CHARACTER VARYING(100) NOT NULL,
  transaction_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pending_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT pending_transactions_short_code_key UNIQUE (short_code),
  CONSTRAINT pending_transactions_reference_number_key UNIQUE (reference_number)
);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_short_code ON public.pending_transactions USING btree (short_code);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_expires_at ON public.pending_transactions USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_used ON public.pending_transactions USING btree (used);
```

### Step 2: Verify Updated Code

The controller has been updated in `controllers/transactionController.js`:
- ✅ `createTransaction()` - Now persists to database
- ✅ `processShortCode()` - Checks database first, then cache
- ✅ `processScannedQRInternal()` - Marks as used in database

### Step 3: Test

1. **Generate a QR code** from vendor dashboard
2. **Wait a moment** (don't process immediately)
3. **Try entering the code manually** on customer side
4. **Should now work!** ✓

### Step 4: Server Restart Test (Optional)

1. Generate a QR code
2. Restart your backend server
3. Try entering the code within 10 mins
4. **Should still work!** ✓ (proves database persistence)

## 🔍 DEBUGGING

Check the backend logs to see which storage location the code was found in:

```
// Database found
Found code in database: ABC123

// In-memory cache found  
Found code in in-memory cache

// Not found anywhere
Code not found anywhere
```

## 🚀 BENEFITS OF THIS FIX

1. **Persistent**: Codes survive server restarts
2. **Scalable**: Works with multiple server instances
3. **Safe**: Database prevents duplicate code generation (UNIQUE constraint)
4. **Trackable**: Every code has a creation timestamp and expiry
5. **Clean**: Codes marked as `used` can be audited/analyzed later
6. **Backward Compatible**: Still falls back to in-memory cache

## 📊 Maintenance

The migration includes an optional cleanup function you can run periodically:

```sql
SELECT cleanup_expired_pending_transactions();
```

This removes expired codes from the database (older than current time AND marked as unused).

---

**Summary**: Your QR codes now persist to the database instead of living only in server memory. Customers can now enter codes even if the server restarts or if there's any delay between code generation and code entry.
