// Test script to verify database connection and server setup
const { createClient } = require('@supabase/supabase-js');

// Check if Supabase is configured
const supabaseUrl = process.env.SUPABASE_URL || 'https://czscuaoinqgolqraaqut.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c2N1YW9pbnFnb2xxcmFhcXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjYzOTgsImV4cCI6MjA2NjYwMjM5OH0.Km_wlH7tgTKqFsqkJ5K1vJNTXZSDgYKjOsuR5q1g6Qk';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

async function testSetup() {
  console.log('🧪 Testing Suki App Backend Setup...\n');
  
  // Test 1: Check if Supabase client is configured
  console.log('1. Checking Supabase configuration...');
  if (supabaseUrl && supabaseUrl !== 'https://czscuaoinqgolqraaqut.supabase.co') {
    console.log('   ✅ Supabase URL is configured');
  } else {
    console.log('   ❌ Supabase URL needs to be configured');
  }
  
  if (supabaseKey && supabaseKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c2N1YW9pbnFnb2xxcmFhcXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjYzOTgsImV4cCI6MjA2NjYwMjM5OH0.Km_wlH7tgTKqFsqkJ5K1vJNTXZSDgYKjOsuR5q1g6Qk') { 
    console.log('   ✅ Supabase Anon Key is configured');
  } else {
    console.log('   ❌ Supabase Anon Key needs to be configured');
  }
  
  // Test 2: Test database connection
  console.log('\n2. Testing database connection...');
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('   ❌ Database connection failed:', error.message);
      } else {
        console.log('   ✅ Database connection successful');
      }
    } catch (error) {
      console.log('   ❌ Database connection error:', error.message);
    }
  } else {
    console.log('   ⚠️  Skipping database test - Supabase not configured');
  }
  
  // Test 3: Test basic queries
  console.log('\n3. Testing basic database queries...');
  if (supabase) {
    try {
      // Test profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (profilesError) {
        console.log('   ⚠️  Profiles table might not exist or have permission issues');
      } else {
        console.log('   ✅ Profiles table accessible');
      }
      
      // Test stores table
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('count')
        .limit(1);
      
      if (storesError) {
        console.log('   ⚠️  Stores table might not exist or have permission issues');
      } else {
        console.log('   ✅ Stores table accessible');
      }
      
    } catch (error) {
      console.log('   ❌ Query test failed:', error.message);
    }
  } else {
    console.log('   ⚠️  Skipping query test - Supabase not configured');
  }
  
  console.log('\n📋 Setup Summary:');
  console.log('   - Backend server: server.js');
  console.log('   - Database client: supabaseClient.js');
  console.log('   - Configuration: config.js');
  console.log('   - Database schema: database-schema.sql');
  console.log('   - Setup guide: BACKEND_SETUP.md');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Update your Supabase credentials in supabaseClient.js');
  console.log('   2. Run the database schema in your Supabase SQL editor');
  console.log('   3. Start the server with: npm run server');
  console.log('   4. Test the health endpoint: http://localhost:3000/health');
  
  console.log('\n✨ Setup complete!');
}

// Run the test
testSetup().catch(console.error);
