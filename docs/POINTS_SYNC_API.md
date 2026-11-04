# Points Sync API Documentation

## Overview
REST API endpoints for syncing and checking user points data. These endpoints ensure that the `user_points` table stays in sync with the `transactions` table.

## Base URL
```
http://localhost:3000/api/points
```

## Endpoints

### 1. Sync User Points
Recalculates and syncs points for a specific user based on their transactions.

**Endpoint:** `POST /points/sync/:userId`

**Parameters:**
- `userId` (path parameter, required): User ID to sync

**Request Example:**
```bash
# Using curl
curl -X POST http://localhost:3000/api/points/sync/41

# Using JavaScript fetch
fetch('http://localhost:3000/api/points/sync/41', { 
  method: 'POST' 
})
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "message": "Points synced successfully",
    "user_id": "41",
    "stores_processed": 1,
    "results": [
      {
        "store_id": "1",
        "status": "updated",
        "total_points": 30,
        "redeemed_points": 0
      }
    ]
  }
}
```

**From React Native:**
```javascript
import apiService from '../services/apiService';

// Sync points for current user
const syncPoints = async (userId) => {
  try {
    const result = await apiService.syncUserPoints(userId);
    console.log('Points synced:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

---

### 2. Sync All Users Points
Syncs points for all users in the system (admin use).

**Endpoint:** `POST /points/sync-all`

**Request Example:**
```bash
# Using curl
curl -X POST http://localhost:3000/api/points/sync-all

# Using JavaScript fetch
fetch('http://localhost:3000/api/points/sync-all', { 
  method: 'POST' 
})
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "message": "All users points synced",
    "users_processed": 15,
    "results": [
      {
        "user_id": 41,
        "status": "success",
        "stores_processed": 1
      },
      {
        "user_id": 42,
        "status": "success",
        "stores_processed": 2
      }
    ]
  }
}
```

**From React Native:**
```javascript
import apiService from '../services/apiService';

// Admin function to sync all users
const syncAllPoints = async () => {
  try {
    const result = await apiService.syncAllUsersPoints();
    console.log('All users synced:', result);
  } catch (error) {
    console.error('Sync all failed:', error);
  }
};
```

---

### 3. Check User Data
Retrieves user's transactions and points data for debugging.

**Endpoint:** `GET /points/check/:userId`

**Parameters:**
- `userId` (path parameter, required): User ID to check
- `limit` (query parameter, optional): Number of transactions to return (default: 10)

**Request Example:**
```bash
# Using curl
curl http://localhost:3000/api/points/check/41?limit=10

# Using JavaScript fetch
fetch('http://localhost:3000/api/points/check/41?limit=10')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user_id": "41",
    "transactions": {
      "count": 4,
      "data": [
        {
          "id": 123,
          "transaction_date": "2025-12-09T17:04:19.27",
          "user_id": 41,
          "store_id": 1,
          "total": "120.00",
          "points": 12,
          "transaction_type": "Purchase",
          "stores": {
            "store_name": "Supreme Bowl"
          }
        }
      ]
    },
    "points": {
      "count": 1,
      "data": [
        {
          "id": 1,
          "user_id": 41,
          "store_id": 1,
          "total_points": 30,
          "redeemed_points": 0,
          "stores": {
            "store_name": "Supreme Bowl"
          }
        }
      ]
    }
  }
}
```

**From React Native:**
```javascript
import apiService from '../services/apiService';

// Check user data
const checkUserData = async (userId) => {
  try {
    const result = await apiService.checkUserData(userId, 10);
    console.log('User data:', result);
  } catch (error) {
    console.error('Check failed:', error);
  }
};
```

---

## Use Cases

### 1. After Manual Transaction Entry
If transactions are added directly to the database, sync points:
```javascript
await apiService.syncUserPoints(userId);
```

### 2. Periodic Maintenance
Run a cron job to sync all users daily:
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * curl -X POST http://localhost:3000/api/points/sync-all
```

### 3. Debugging Points Issues
Check user's data to diagnose why points aren't showing:
```javascript
const data = await apiService.checkUserData(userId);
console.log('Transactions:', data.transactions);
console.log('Points:', data.points);
```

### 4. User Support Tool
Add a "Refresh Points" button in the app:
```javascript
const handleRefreshPoints = async () => {
  try {
    setLoading(true);
    const user = await AsyncStorage.getItem('@app_user');
    const userId = JSON.parse(user).user_id;
    await apiService.syncUserPoints(userId);
    Alert.alert('Success', 'Your points have been refreshed!');
    // Reload the screen data
    await fetchData();
  } catch (error) {
    Alert.alert('Error', 'Failed to refresh points');
  } finally {
    setLoading(false);
  }
};
```

---

## Scripts vs API

Both methods work - choose based on your needs:

### Use Scripts (`node sync-user-points.js`)
- Quick one-time fixes
- Database maintenance
- Development/debugging
- No server needed

### Use API (`POST /points/sync/:userId`)
- Integrate into app features
- Automated processes
- Remote execution
- Consistent with app architecture

---

## Error Handling

All endpoints return standardized responses:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

Handle errors in your code:
```javascript
try {
  const result = await apiService.syncUserPoints(userId);
  if (result.success) {
    console.log('Success:', result.data);
  }
} catch (error) {
  console.error('API Error:', error.message);
  Alert.alert('Error', error.message);
}
```
