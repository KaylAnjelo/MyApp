const express = require('express');
const authController = require('../controllers/authController'); // path to your authController

const router = express.Router();

// Define routes
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/send-otp', (req, res) => authController.sendOTP(req, res));
router.post('/auth/verify-otp', (req, res) => authController.verifyOTPAndRegister(req, res));
router.post('/auth/vendor-register', (req, res) => authController.verifyStoreCodeAndRegister(req, res));
router.post('/auth/vendor-verify-otp', (req, res) => authController.verifyOTPAndRegisterVendor(req, res));
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/logout', (req, res) => authController.logout(req, res));
router.get('/auth/profile', (req, res) => authController.getProfile(req, res));
router.post('/auth/send-password-reset-otp', (req, res) => authController.sendPasswordResetOTP(req, res));
router.post('/auth/verify-password-reset-otp', (req, res) => authController.verifyPasswordResetOTP(req, res));
router.post('/auth/change-password', (req, res) => authController.changePassword(req, res));

module.exports = router;
