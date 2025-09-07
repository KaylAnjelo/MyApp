// Configuration file for the Suki App backend
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  
  // API configuration
  api: {
    prefix: '/api',
    version: 'v1',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Points system configuration
  points: {
    pointsPerDollar: 1, // 1 point per $1 spent
    minPointsForReward: 100,
  },
};

// Validation function
const validateConfig = () => {
  const required = ['supabase.url', 'supabase.anonKey'];
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value || value.includes('YOUR_') || value.includes('your_');
  });
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing or invalid configuration:', missing);
    console.warn('Please update your environment variables in .env file');
    return false;
  }
  
  return true;
};

module.exports = {
  config,
  validateConfig,
};
