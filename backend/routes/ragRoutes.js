const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/ask', ragController.askAssistant);

module.exports = router;
