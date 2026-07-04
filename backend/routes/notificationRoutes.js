const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, notificationController.getNotifications);
router.get('/unread-count', requireAuth, notificationController.getUnreadCount);
router.patch('/:id/read', requireAuth, notificationController.markNotificationAsRead);
router.patch('/read-all', requireAuth, notificationController.markAllNotificationsAsRead);

module.exports = router;