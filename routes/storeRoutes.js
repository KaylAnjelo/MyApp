const express = require("express");
const router = express.Router();

// Try to load Supabase client (matches pattern used in userRoutes.js)
const { supabase } = require('../supabaseClient');

// Example dummy stores data (replace with Supabase later)
const stores = [
  { id: 1, name: "Store A", location: "City Center" },
  { id: 2, name: "Store B", location: "Mall" }
];

// Helper to normalize store objects so the frontend can read `address`
const normalizeStores = (arr) => {
  return arr.map(s => ({
    // preserve existing fields and ensure `address` exists (fallback to `location`)
    ...s,
    address: s.address || s.location || null,
  }));
};

// GET /api/stores
router.get("/stores", async (req, res) => {
  try {
    // If Supabase client isn't configured (dev mode), return normalized dummy data
    if (!supabase) {
      return res.json(normalizeStores(stores));
    }

    // Query the `stores` table for active stores
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching stores from Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    // Normalize records so frontend sees `address`
    const normalized = normalizeStores(data || []);
    res.json(normalized);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
