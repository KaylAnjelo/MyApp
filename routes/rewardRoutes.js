const express = require('express');
const router = express.Router();
const redemptionController = require('../controllers/redemptionController');
// Claimed reward usage endpoint
router.patch('/claimed/:claimedRewardId/use', (req, res) => redemptionController.useClaimedReward(req, res));

// Rewards endpoints
router.get('/', (req, res) => redemptionController.getRewards(req, res));
router.get('/store/:storeId', (req, res) => redemptionController.getRewardsByStore(req, res));
router.get('/customer/:customerId/available', (req, res) => redemptionController.getAvailableRewards(req, res));
router.get('/:rewardId', (req, res) => redemptionController.getReward(req, res));

// Redemption endpoints
router.post('/redeem', (req, res) => redemptionController.redeemReward(req, res));
router.post('/redeem-product', (req, res) => redemptionController.redeemProduct(req, res));
router.get('/customer/:customerId/history', (req, res) => redemptionController.getRedemptionHistory(req, res));
router.patch('/redemptions/:redemptionId/status', (req, res) => redemptionController.updateRedemptionStatus(req, res));
router.get('/owner/:ownerId/redemptions', (req, res) => redemptionController.getStoreRedemptions(req, res));
router.post('/redemptions/generate-code', (req, res) => redemptionController.generateRedemptionCode(req, res));

module.exports = router;
