const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/', courseController.getCourses);
router.post('/', courseController.createCourse);
router.get('/:courseId', courseController.getCourseById);
router.patch('/:courseId', courseController.updateCourse);
router.delete('/:courseId', courseController.deleteCourse);
router.post('/:courseId/send-update', requireAuth, requireRole('admin'), courseController.sendCourseUpdate);

module.exports = router;
