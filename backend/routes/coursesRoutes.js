const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getCourses);
router.post('/', courseController.createCourse);
router.get('/:courseId', courseController.getCourseById);
router.patch('/:courseId', courseController.updateCourse);
router.delete('/:courseId', courseController.deleteCourse);

module.exports = router;
