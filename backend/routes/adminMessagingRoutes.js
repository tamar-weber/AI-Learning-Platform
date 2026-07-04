const express = require('express');
const router = express.Router();
const adminMessagingController = require('../controllers/adminMessagingController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth, requireRole('admin'));

router.get('/campaigns', adminMessagingController.getCampaignHistory);
router.post('/campaigns', adminMessagingController.createCampaign);

module.exports = router;
