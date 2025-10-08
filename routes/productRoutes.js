const express = require('express');
const router = express.Router();

// Dummy products data for development/testing
const products = [
  { id: 1, storeId: 1, name: 'Cheese Shawarma', price: 120, image_url: '', description: 'Delicious' },
  { id: 2, storeId: 1, name: 'Chicken Shawarma', price: 110, image_url: '', description: 'Tasty' },
  { id: 3, storeId: 2, name: 'Vegan Wrap', price: 90, image_url: '', description: 'Healthy' }
];

// GET /api/products - return all products
router.get('/products', async (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:storeId - return products for a specific store
router.get('/products/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId, 10);
    const filtered = products.filter(p => p.storeId === storeId);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching products by store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
