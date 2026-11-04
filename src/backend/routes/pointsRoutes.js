const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');

// POST /api/points/sync/:userId - Sync points for a specific user
router.post('/sync/:userId', (req, res) => pointsController.syncUserPoints(req, res));

// POST /api/points/sync-all - Sync points for all users (admin only)
router.post('/sync-all', (req, res) => pointsController.syncAllUsersPoints(req, res));

// GET /api/points/check/:userId - Check user transactions and points data
router.get('/check/:userId', (req, res) => pointsController.checkUserData(req, res));

module.exports = router;
