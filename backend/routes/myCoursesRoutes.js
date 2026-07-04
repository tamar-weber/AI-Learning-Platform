const express = require('express');
const router = express.Router();
const myCoursesController = require('../controllers/myCoursesController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/purchase', myCoursesController.purchaseCourse);
router.post('/checkout-session', requireAuth, myCoursesController.createCheckoutSession);
router.get('/:userId', myCoursesController.getMyCourses);

module.exports = router;
