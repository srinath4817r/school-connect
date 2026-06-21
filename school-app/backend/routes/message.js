const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
// Get unread counts
router.get('/unread', protect, messageController.getUnreadCounts);

// Mark as read
router.put('/read', protect, messageController.markAsRead);

// Get chat logs
router.get('/', protect, messageController.getMessages);

// Send new message
router.post('/', protect, messageController.sendMessage);

module.exports = router;
