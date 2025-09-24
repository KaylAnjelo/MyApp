const express = require('express');
const authController = require('../controllers/authController'); // path to your authController

const router = express.Router();

// Define routes
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/logout', (req, res) => authController.logout(req, res));
router.get('/auth/profile', (req, res) => authController.getProfile(req, res));

module.exports = router;
