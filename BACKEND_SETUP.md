# Suki App Backend Setup Guide

This guide will help you set up the Node.js backend server and database connection for your Suki Android application.

## Prerequisites

- Node.js (version 18 or higher)
- A Supabase account and project
- Git (if cloning the repository)

## 1. Install Dependencies

First, install the required dependencies:

```bash
npm install
```

This will install all the necessary packages including:
- Express.js for the web server
- Supabase client for database operations
- CORS for cross-origin requests
- dotenv for environment variables

## 2. Set Up Supabase Database

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Create a new project
4. Note down your project URL and anon key

### 2.2 Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL script to create all necessary tables and policies

### 2.3 Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your authentication providers (email, phone, etc.)
3. Set up any additional authentication settings as needed

## 3. Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Additional database URL if needed
DATABASE_URL=your_database_url_here
```

**Important:** Replace the placeholder values with your actual Supabase credentials.

## 4. Update Supabase Client Configuration

Update the `supabaseClient.js` file with your actual Supabase credentials:

```javascript
const supabaseUrl = 'YOUR_ACTUAL_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_ACTUAL_SUPABASE_ANON_KEY';
```

## 5. Start the Backend Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm run server
```

The server will start on `http://localhost:3000` by default.

## 6. Test the Connection

### Health Check
Visit `http://localhost:3000/health` in your browser or use curl:

```bash
curl http://localhost:3000/health
```

You should see a response like:
```json
{
  "status": "success",
  "message": "Server and database are running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 7. API Endpoints

The backend provides the following API endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/profile/:userId` - Get user profile
- `PUT /api/user/profile/:userId` - Update user profile

### Stores
- `GET /api/stores` - Get all active stores
- `GET /api/stores/:storeId` - Get specific store details

### Transactions
- `GET /api/transactions/:userId` - Get user transactions
- `POST /api/transactions` - Create new transaction

### Rewards
- `GET /api/rewards/:userId` - Get user rewards

## 8. Connect Your React Native App

In your React Native app, you can now use the backend API by making HTTP requests to `http://localhost:3000/api/...` or use the Supabase client directly.

### Example API Call in React Native

```javascript
// Using fetch
const response = await fetch('http://localhost:3000/api/stores');
const stores = await response.json();

// Using the Supabase client
import { supabase } from './supabaseClient';
const { data: stores } = await supabase.from('stores').select('*');
```

## 9. Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your Supabase URL and anon key are correct
   - Check if your Supabase project is active
   - Ensure the database schema has been created

2. **CORS Issues**
   - The server is configured to allow all origins in development
   - For production, update the CORS configuration in `server.js`

3. **Port Already in Use**
   - Change the PORT in your `.env` file
   - Or kill the process using the port: `npx kill-port 3000`

4. **Missing Dependencies**
   - Run `npm install` to install all dependencies
   - Check that all packages are properly installed

### Logs

The server logs important information to the console. Check the console output for any error messages or warnings.

## 10. Next Steps

1. Test all API endpoints using Postman or curl
2. Integrate the API calls into your React Native screens
3. Implement proper error handling in your app
4. Set up authentication flow
5. Add data validation and sanitization
6. Consider adding rate limiting for production

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your Supabase configuration
3. Ensure all dependencies are installed
4. Check that the database schema is properly set up

For additional help, refer to the [Supabase documentation](https://supabase.com/docs) or [Express.js documentation](https://expressjs.com/).
