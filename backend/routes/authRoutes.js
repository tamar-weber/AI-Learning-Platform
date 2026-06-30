const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../models/authService');

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

module.exports = router;
