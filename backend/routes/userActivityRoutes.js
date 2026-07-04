const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/userActivityController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/', requireAuth, userActivityController.getMyActivity);
router.get('/user/:userId', requireAuth, requireRole('admin'), userActivityController.getActivityForUser);

module.exports = router;