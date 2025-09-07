import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database connection test function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return false;
  }
};

// Authentication helpers
export const authHelpers = {
  // Sign up user
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  // Sign in user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }
};

// Database helpers
export const dbHelpers = {
  // Get user profile
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Get stores
  getStores: async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true);
    return { data, error };
  },

  // Get user transactions
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

  // Create transaction
  createTransaction: async (transactionData) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    return { data, error };
  },

  // Get user rewards
  getUserRewards: async (userId) => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

export default supabase;
