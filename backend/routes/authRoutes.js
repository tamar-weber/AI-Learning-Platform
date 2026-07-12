const express = require('express');
const router = express.Router();
const { registerUser, loginUser, requestPasswordReset, resetPassword, updateProfile } = require('../models/authService');
const { requireAuth } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const newUser = await registerUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
});

router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const user = await loginUser(req.body);
        res.json(user);
    } catch (error) {
        next(error);
    }
});

router.post('/forgot-password', async (req, res, next) => {
    try {
        const result = await requestPasswordReset(req.body.email);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password', async (req, res, next) => {
    try {
        const result = await resetPassword(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.patch('/profile', requireAuth, async (req, res, next) => {
    try {
        const result = await updateProfile({
            authUserId: req.user._id,
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
