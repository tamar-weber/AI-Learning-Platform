const express = require('express');
const router = express.Router();
const myCoursesController = require('../controllers/myCoursesController');

router.post('/purchase', myCoursesController.purchaseCourse);
router.get('/:userId', myCoursesController.getMyCourses);

module.exports = router;
