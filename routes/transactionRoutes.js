// backend/routes/transactionRoutes.js
const express = require('express');
const transactionController = require('../controllers/transactionController');
const router = express.Router();

// POST - Generate QR code data for transaction
router.post('/generate-qr', (req, res) => transactionController.createTransaction(req, res));

// POST - Process scanned QR code
router.post('/process-qr', (req, res) => transactionController.processScannedQR(req, res));

// POST - Process manual code entry
router.post('/process-code', (req, res) => transactionController.processShortCode(req, res));

// GET - Get transactions by user
router.get('/user/:userId', (req, res) => transactionController.getUserTransactions(req, res));

// GET - Get transactions by store
router.get('/store/:storeId', (req, res) => transactionController.getStoreTransactions(req, res));

module.exports = router;
