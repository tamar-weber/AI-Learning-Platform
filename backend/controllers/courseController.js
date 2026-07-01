const courseService = require('../models/courseService');

async function createCourse(req, res, next) {
    try {
        const course = await courseService.createCourse(req.body);
        console.log('✅ Course created successfully:', {
            id: course.id,
            courseName: course.courseName,
            lecturerName: course.lecturerName
        });
        res.status(201).json(course);
    } catch (error) {
        next(error);
    }
}

async function getCourses(req, res, next) {
    try {
        const courses = await courseService.getAllCourses();
        res.json(courses);
    } catch (error) {
        next(error);
    }
}

async function getCourseById(req, res, next) {
    try {
        const course = await courseService.getCourseById(req.params.courseId);
        res.json(course);
    } catch (error) {
        next(error);
    }
}

async function updateCourse(req, res, next) {
    try {
        const course = await courseService.updateCourse(req.params.courseId, req.body);
        console.log('✅ Course updated successfully:', {
            id: course.id,
            courseName: course.courseName,
            lecturerName: course.lecturerName
        });
        res.json(course);
    } catch (error) {
        next(error);
    }
}

async function deleteCourse(req, res, next) {
    try {
        const result = await courseService.deleteCourse(req.params.courseId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};
