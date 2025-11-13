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

// POST /api/user/upload-profile-image
router.post('/user/upload-profile-image', async (req, res) => {
  try {
    const { userId, imageBase64, fileName } = req.body;

    if (!userId || !imageBase64 || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a simple file path
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const filePath = `${userId}_${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage with public access
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Try to provide helpful error message
      if (uploadError.message.includes('row-level security')) {
        return res.status(500).json({ 
          error: 'Storage bucket requires configuration. Please make the profile-images bucket public in Supabase Dashboard.' 
        });
      }
      return res.status(500).json({ error: uploadError.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update user profile with image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image: imageUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ 
      message: 'Profile image uploaded successfully', 
      imageUrl 
    });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/:userId/points-by-store
router.get('/user/:userId/points-by-store', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[userRoutes] GET /user/:userId/points-by-store called with userId=', userId);

    if (!supabase) {
      // Dev fallback: return mock data
      return res.json([
        {
          store_id: 1,
          store_name: 'Shawarma Store',
          available_points: 115,
        },
        {
          store_id: 2,
          store_name: 'Coffee Shop',
          available_points: 45,
        },
      ]);
    }

    // Get all transactions for this user grouped by store with sum of points
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        store_id,
        points,
        stores:store_id(store_id, store_name)
      `)
      .eq('user_id', userId);

    if (transError) {
      console.error('[userRoutes] Error fetching transactions:', transError);
      return res.status(400).json({ error: transError.message });
    }

    // Group by store and sum points
    const pointsByStore = {};
    if (transactions && Array.isArray(transactions)) {
      transactions.forEach(transaction => {
        const storeId = transaction.store_id;
        if (!pointsByStore[storeId]) {
          pointsByStore[storeId] = {
            store_id: storeId,
            store_name: transaction.stores?.store_name || 'Store',
            available_points: 0,
          };
        }
        pointsByStore[storeId].available_points += parseFloat(transaction.points || 0);
      });
    }

    const result = Object.values(pointsByStore).sort((a, b) => b.available_points - a.available_points);
    res.json(result);
  } catch (err) {
    console.error('Error fetching points by store:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
