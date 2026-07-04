const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth, requireRole('admin'));

router.get('/', adminDashboardController.getDashboard);

module.exports = router;
