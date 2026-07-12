const courseService = require('../models/courseService');
const courseUpdateService = require('../models/courseUpdateService');
const ragService = require('../models/ragService');

async function createCourse(req, res, next) {
    try {
        const course = await courseService.createCourse(req.body);
        ragService.syncCourse(course.id).catch((error) => console.error('Failed to sync course to RAG:', error.message));
        res.status(201).json(course);
    } catch (error) {
        next(error);
    }
}

async function getCourses(req, res, next) {
    try {
        const courses = await courseService.getAllCourses(req.query);
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
        ragService.syncCourse(course.id).catch((error) => console.error('Failed to sync course to RAG:', error.message));
        res.json(course);
    } catch (error) {
        next(error);
    }
}

async function deleteCourse(req, res, next) {
    try {
        const result = await courseService.deleteCourse(req.params.courseId);
        ragService.removeDocumentBySource('course', req.params.courseId).catch((error) => console.error('Failed to sync deleted course out of RAG:', error.message));
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function sendCourseUpdate(req, res, next) {
    try {
        const summary = await courseUpdateService.sendCourseUpdateToEnrolledUsers(req.params.courseId);
        res.json(summary);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    sendCourseUpdate
};
