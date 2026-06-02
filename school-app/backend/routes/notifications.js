const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get current user's unread notifications
router.get('/', notificationController.getMyNotifications);

// @route   POST /api/notifications/mark-read/:id
// @desc    Mark a notification as read/resolved
router.post('/mark-read/:id', notificationController.markNotificationRead);

// @route   POST /api/notifications/push-update
// @desc    Broadcast a details update request to a role group (Admin/Principal/Super Admin)
router.post('/push-update', authorize(['super_admin', 'school_admin', 'principal']), notificationController.pushUpdateDetailsRequest);

module.exports = router;
