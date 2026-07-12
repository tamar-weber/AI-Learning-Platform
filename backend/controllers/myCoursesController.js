const myCoursesService = require('../models/myCoursesService');
const stripeService = require('../models/stripeService');
const AppError = require('../utils/appError');
const { config } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

async function purchaseCourse() {
    throw new AppError('הרשמה ישירה בוטלה. יש לבצע רכישה דרך Stripe Checkout בלבד.', 400);
}

async function getMyCourses(req, res) {
    const courses = await myCoursesService.getPurchasedCourses(req.params.userId);
    res.json(courses);
}

async function createCheckoutSession(req, res) {
    const { courseId } = req.body;

    const data = await stripeService.createCheckoutSession({
        userId: req.user._id,
        courseId,
        successUrl: `${config.frontendUrl}/my-courses?payment=success`,
        cancelUrl: `${config.frontendUrl}/my-courses?payment=cancel`
    });

    res.status(201).json(data);
}

module.exports = {
    purchaseCourse: asyncHandler(purchaseCourse),
    getMyCourses: asyncHandler(getMyCourses),
    createCheckoutSession: asyncHandler(createCheckoutSession)
};
