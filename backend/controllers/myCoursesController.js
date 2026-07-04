const myCoursesService = require('../models/myCoursesService');
const stripeService = require('../models/stripeService');
const AppError = require('../utils/appError');

async function purchaseCourse(req, res, next) {
    try {
        throw new AppError('הרשמה ישירה בוטלה. יש לבצע רכישה דרך Stripe Checkout בלבד.', 400);
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

async function createCheckoutSession(req, res, next) {
    try {
        const { courseId } = req.body;
        const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

        const data = await stripeService.createCheckoutSession({
            userId: req.user._id,
            courseId,
            successUrl: `${frontendBaseUrl}/my-courses?payment=success`,
            cancelUrl: `${frontendBaseUrl}/my-courses?payment=cancel`
        });

        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    purchaseCourse,
    getMyCourses,
    createCheckoutSession
};
