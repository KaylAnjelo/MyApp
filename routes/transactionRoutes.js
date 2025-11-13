// backend/routes/transactionRoutes.js
const express = require('express');
const transactionController = require('../controllers/transactionController');
const router = express.Router();

// POST - Generate QR code data for transaction
router.post('/generate-qr', transactionController.createTransaction);

// POST - Process scanned QR code
router.post('/process-qr', transactionController.processScannedQR);

// POST - Process manual code entry
router.post('/process-code', transactionController.processShortCode);

// GET - Get transactions by user
router.get('/user/:userId', transactionController.getUserTransactions);

// GET - Get transactions by store
router.get('/store/:storeId', transactionController.getStoreTransactions);

module.exports = router;
