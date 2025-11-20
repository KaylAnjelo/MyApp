const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

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

    console.log('[userRoutes] PUT /user/profile/:userId called with userId=', userId);
    console.log('[userRoutes] Updates:', updates);

    if (!supabase) {
      // Dev fallback: echo back updates with id
      return res.json({ success: true, user_id: userId, ...updates });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    console.log('[userRoutes] Update result:', { data, error });

    if (error) {
      console.error('[userRoutes] Update error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Profile updated successfully', user: data });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/upload-profile-image
router.post('/user/upload-profile-image', async (req, res) => {
  try {
    console.log('🔍 Upload/Remove request received:', req.body);
    const { userId, imageBase64, fileName } = req.body;

    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // If no imageBase64 provided, this is a removal request
    if (!imageBase64) {
      console.log('🗑️ Processing image removal for userId:', userId);
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image: null })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error removing profile image from database:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      console.log('✅ Image removed successfully for userId:', userId);
      return res.json({
        success: true,
        message: 'Profile image removed successfully',
        imageUrl: null
      });
    }

    if (!fileName) {
      console.log('❌ Missing fileName for upload');
      return res.status(400).json({ error: 'File name is required for upload' });
    }

    console.log('📸 Processing image upload for userId:', userId);

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

// DELETE /api/user/remove-profile-image
router.delete('/user/remove-profile-image', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update user profile to remove image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image: null })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error removing profile image from database:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    res.json({
      success: true,
      message: 'Profile image removed successfully'
    });
  } catch (err) {
    console.error('Error removing profile image:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/:userId/points?storeId=1 (store-specific points)
router.get('/user/:userId/points', async (req, res) => {
  try {
    const { userId } = req.params;
    const { storeId } = req.query;
    console.log('[userRoutes] GET /user/:userId/points called with userId=', userId, 'storeId=', storeId);

    if (!supabase) {
      // Dev fallback: return mock data
      return res.json({
        user_id: userId,
        store_id: storeId || null,
        total_points: 150,
        redeemed_points: 0
      });
    }

    // Build query for user points
    let query = supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId);

    // If storeId provided, filter by store
    if (storeId) {
      query = query.eq('store_id', storeId);
    } else {
      // If no storeId, get record where store_id is null (global points, if any)
      query = query.is('store_id', null);
    }

    const { data: userPoints, error: pointsError } = await query.single();

    if (pointsError) {
      if (pointsError.code === 'PGRST116') {
        // No record found, return zero points
        console.log('[userRoutes] No user_points record found for user:', userId, 'store:', storeId);
        return res.json({
          user_id: userId,
          store_id: storeId ? parseInt(storeId) : null,
          total_points: 0,
          redeemed_points: 0
        });
      }
      console.error('[userRoutes] Error fetching user points:', pointsError);
      return res.status(400).json({ error: pointsError.message });
    }

    res.json({
      user_id: userId,
      store_id: userPoints.store_id,
      total_points: userPoints.total_points || 0,
      redeemed_points: userPoints.redeemed_points || 0
    });
  } catch (err) {
    console.error('Error fetching user points:', err);
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
