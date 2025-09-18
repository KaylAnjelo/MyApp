const { createClient } = require('@supabase/supabase-js');
const { config, validateConfig } = require('./config');

// Validate configuration on startup
if (!validateConfig()) {
  console.error('❌ Configuration validation failed');
  process.exit(1);
}

// Initialize Supabase client using your config
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side doesn't need to persist sessions
      detectSessionInUrl: false
    }
  }
);

// Test connection with better error handling
const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Try to connect to your users table first
    const { error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    // If users table doesn't exist, try profiles table
    if (usersError && usersError.code === 'PGRST116') {
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (profilesError && profilesError.code === 'PGRST116') {
        console.warn('⚠️  Neither users nor profiles table found');
        console.warn('Please ensure your database tables are set up correctly');
      } else if (profilesError) {
        console.error('❌ Supabase connection failed:', profilesError.message);
        return false;
      } else {
        console.log('✅ Supabase connected successfully (using profiles table)');
      }
    } else if (usersError) {
      console.error('❌ Supabase connection failed:', usersError.message);
      return false;
    } else {
      console.log('✅ Supabase connected successfully (using users table)');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
};

// Test connection on startup
testConnection();

// Export both the client and config for use in controllers
module.exports = {
  supabase,
  config
};