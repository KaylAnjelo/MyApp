// backend/routes/TransactionRoutes.js
const express = require('express');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// POST - Generate QR code data for transaction
router.post('/transactions/generate-qr', (req, res) => transactionController.createTransaction(req, res));

// POST - Process scanned QR code
router.post('/transactions/process-qr', (req, res) => transactionController.processScannedQR(req, res));

// GET - Get transactions by user
router.get('/transactions/user/:userId', (req, res) => transactionController.getUserTransactions(req, res));

module.exports = router;
