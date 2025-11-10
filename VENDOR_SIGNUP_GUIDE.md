# Vendor Signup with Store Code Verification

## Overview
Vendors must use a valid **store code** to register. This ensures vendors are properly linked to their stores during signup.

## How It Works

### 1. Store Code Verification Flow
1. Vendor enters their store code (provided by store manager)
2. System validates the store code against the `stores` table
3. System checks if the store is active
4. If valid, vendor account is created and linked to that store

### 2. Backend Implementation

**New Endpoint:** `POST /api/auth/vendor-register`

**Request Body:**
```json
{
  "store_code": "STORE123",
  "username": "vendor@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "contact_number": "09123456789",
  "user_email": "vendor@example.com"
}
```

**Validation Steps:**
1. ✅ Check store code exists in database
2. ✅ Verify store is active (`is_active = true`)
3. ✅ Check username/email not already registered
4. ✅ Hash password with bcrypt
5. ✅ Create vendor user with `role = 'vendor'` and linked `store_id`

**Success Response:**
```json
{
  "message": "Vendor registered successfully",
  "user": {
    "user_id": 123,
    "username": "vendor@example.com",
    "role": "vendor",
    "first_name": "John",
    "last_name": "Doe",
    "user_email": "vendor@example.com",
    "store_id": 5,
    "store_name": "Sample Store"
  }
}
```

**Error Responses:**
- `400 Bad Request`: "Invalid store code"
- `400 Bad Request`: "This store is currently inactive"
- `400 Bad Request`: "Username already exists"
- `400 Bad Request`: "Email already registered"

### 3. Frontend Implementation

**SignUpVendorScreen.js Changes:**
- Added `storeCode` field to form
- Input field with `autoCapitalize="characters"` for store codes
- Calls `apiService.registerVendorWithStoreCode()`
- Saves user data to AsyncStorage for profile screen
- Shows store name in success message
- Custom error messages for different failure scenarios

**Form Fields:**
1. Store Code (new - required)
2. First Name
3. Last Name
4. Phone
5. Email
6. Password

### 4. Database Schema

**stores table:**
- `store_code`: Unique identifier for each store (TEXT, UNIQUE)
- `is_active`: Boolean flag for active/inactive stores
- Generated automatically via `generate_store_code()` trigger

**users table:**
- `role`: Set to 'vendor' for vendor accounts
- `store_id`: Foreign key linking to stores table

## Testing

### To Test Vendor Registration:

1. **Get a valid store code from database:**
   ```sql
   SELECT store_code, store_name, is_active FROM stores WHERE is_active = true;
   ```

2. **Use the store code in vendor signup:**
   - Open app → Get Started → Sign Up → Vendor
   - Enter the store code from database
   - Fill in other details
   - Submit

3. **Verify registration:**
   - Check profile shows correct store association
   - Login should work with new credentials
   - User should have `role = 'vendor'` and correct `store_id`

### Common Issues:

**"Invalid store code"**
- Store code doesn't exist in database
- Check spelling/case sensitivity

**"This store is currently inactive"**
- Store exists but `is_active = false`
- Contact admin to activate store

**"Email already registered"**
- Try different email address
- Or login with existing account

## Security Notes

- Store codes should be kept confidential
- Only store managers should distribute store codes
- Inactive stores cannot register new vendors
- All passwords are hashed with bcrypt (10 rounds)
