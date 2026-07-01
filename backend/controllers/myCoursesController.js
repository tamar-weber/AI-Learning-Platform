const myCoursesService = require('../models/myCoursesService');

async function purchaseCourse(req, res, next) {
    try {
        const { userId, courseId } = req.body;
        const course = await myCoursesService.purchaseCourse(userId, courseId);
        res.status(201).json(course);
    } catch (error) {
        next(error);
    }
}

async function getMyCourses(req, res, next) {
    try {
        const courses = await myCoursesService.getPurchasedCourses(req.params.userId);
        res.json(courses);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    purchaseCourse,
    getMyCourses
};
