const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// GET /api/user/profile/:userId
router.get('/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[userRoutes] GET /user/profile/:userId called with userId=', userId);
    console.log('[userRoutes] Authorization header=', req.headers && req.headers.authorization);

    if (!supabase) {
      // Dev fallback: return a mocked profile
      return res.json({
        user_id: userId,
        name: 'Dev User',
        email: `dev+${userId}@example.com`,
        role: 'customer'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('[userRoutes] supabase returned:', { data, error });

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile/:userId
router.put('/user/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!supabase) {
      // Dev fallback: echo back updates with id
      return res.json({ user_id: userId, ...updates });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Profile updated successfully', user: data });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
