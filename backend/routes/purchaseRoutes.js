const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, purchaseController.getMyPurchases);

module.exports = router;
