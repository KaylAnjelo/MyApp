const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// GET /api/products - return all products
router.get('/products', (req, res) => productController.getAllProducts(req, res));

// GET /api/products/store/:storeId - return products for a specific store
router.get('/products/store/:storeId', (req, res) => productController.getProductsByStore(req, res));

// GET /api/products/:id - return single product by ID
router.get('/products/:id', (req, res) => productController.getProductById(req, res));

// POST /api/products - create new product
router.post('/products', (req, res) => productController.createProduct(req, res));

// PUT /api/products/:id - update product
router.put('/products/:id', (req, res) => productController.updateProduct(req, res));

// DELETE /api/products/:id - delete product
router.delete('/products/:id', (req, res) => productController.deleteProduct(req, res));

module.exports = router;
