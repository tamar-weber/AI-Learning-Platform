const express = require('express');
const router = express.Router();
const { registerUser, loginUser, requestPasswordReset, resetPassword, updateProfile } = require('../models/authService');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', async (req, res, next) => {
    try {
        console.log('DEBUG register body:', {
            name: req.body.name,
            email: req.body.email,
            hasPassword: Boolean(req.body.password),
            passwordLength: req.body.password ? req.body.password.length : 0
        });
        const newUser = await registerUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
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
