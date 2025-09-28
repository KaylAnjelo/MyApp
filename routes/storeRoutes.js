const express = require("express");
const router = express.Router();

// Example dummy stores data (replace with Supabase later)
const stores = [
  { id: 1, name: "Store A", location: "City Center" },
  { id: 2, name: "Store B", location: "Mall" }
];

// GET /api/stores
router.get("/stores", async (req, res) => {
  try {
    // For now, just return dummy data
    res.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
