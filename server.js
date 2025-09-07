const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://czscuaoinqgolqraaqut.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c2N1YW9pbnFnb2xxcmFhcXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjYzOTgsImV4cCI6MjA2NjYwMjM5OH0.Km_wlH7tgTKqFsqkJ5K1vJNTXZSDgYKjOsuR5q1g6Qk';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      });
    }
    
    res.json({ 
      status: 'success', 
      message: 'Server and database are running',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error',
      error: err.message 
    });
  }
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { user_email, password, user_type, full_name, phone } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type,
          full_name,
          phone
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'User registered successfully',
      user: data.user 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const {user_email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'Login successful',
      user: data.user,
      session: data.session 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User profile routes
app.get('/api/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: data 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stores routes
app.get('/api/stores', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions routes
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        stores(name, address),
        users(full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { user_id, store_id, amount, points_earned, description } = req.body;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id,
        store_id,
        amount,
        points_earned,
        description,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'Transaction recorded successfully',
      transaction: data 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products routes (since rewards table doesn't exist)
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
