const express = require('express');
const router = express.Router();
const historyService = require('../models/historyService');

router.get('/user/:userId', async (req, res, next) => {
    try {
        const history = await historyService.getHistoryForUser(req.params.userId);
        res.json(history);
    } catch (err) {
        next(err);
    }
});

router.post('/add-to-history', async (req, res, next) => {
    try {
        const { userId, prompt, category, subCategory, response } = req.body;
        const newHistory = await historyService.addHistory({
            userId,
            prompt,
            category,
            subCategory,
            response
        });

        res.json({ success: true, history: newHistory });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
