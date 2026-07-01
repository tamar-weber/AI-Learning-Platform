const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.getUsers);
router.get('/user/:userId', adminController.getUserById);
router.get('/all-prompts', adminController.getAllPrompts);
router.delete('/user/:userId', adminController.deleteUser);

module.exports = router;