// Convert to CommonJS so server and routes (which use require) can load this file
require('dotenv').config();

// Try to require the supabase client. If the package provides ESM-only exports,
// Node may still allow require() depending on the package distribution. If this
// fails in your environment, we can switch strategies (create a small wrapper
// or pin a compatible supabase-js version).
let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (err) {
  // Fallback: attempt dynamic import (shouldn't be needed in most setups)
  createClient = (...args) => import('@supabase/supabase-js').then(m => m.createClient(...args));
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// If createClient returned a function that returns a Promise (fallback), handle it.
let supabase;
if (typeof createClient === 'function') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    // If createClient is async (from dynamic import), initialize asynchronously.
    (async () => {
      const clientFactory = await createClient;
      supabase = clientFactory(supabaseUrl, supabaseAnonKey);
    })();
  }
}

// Helper functions (CommonJS exports)
const testConnection = async () => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized yet');
      return false;
    }
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return false;
  }
};

const authHelpers = {
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });
    return { data, error };
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },
};

const dbHelpers = {
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },
  getStores: async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true);
    return { data, error };
  },
  getUserTransactions: async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        stores(name, address),
        profiles(full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
  createTransaction: async (transactionData) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    return { data, error };
  },
  getUserRewards: async (userId) => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
};

module.exports = {
  supabase,
  testConnection,
  authHelpers,
  dbHelpers,
};
