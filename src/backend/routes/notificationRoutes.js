const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationsController');

// Get all notifications for a user
router.get('/:userId', notificationController.getUserNotifications);

// Mark a notification as read
router.patch('/read/:notificationId', notificationController.markAsRead);

// (Optional) Create a notification manually
router.post('/', notificationController.createNotification);

module.exports = router;