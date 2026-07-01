const mongoose = require('mongoose');
const Course = require('../middleware/Course');
const CoursePurchase = require('../middleware/CoursePurchase');
const AppError = require('../utils/appError');

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

function mapCourse(courseDoc, purchasedAt = null) {
    if (!courseDoc) {
        return null;
    }

    return {
        id: courseDoc._id,
        courseName: courseDoc.courseName,
        lecturerName: courseDoc.lecturerName,
        courseDescription: courseDoc.courseDescription,
        lessonsCount: courseDoc.lessonsCount,
        category: courseDoc.category,
        currentEnrollment: courseDoc.currentEnrollment,
        courseStartDate: courseDoc.courseStartDate,
        enrollmentCloseDate: courseDoc.enrollmentCloseDate,
        coursePrice: courseDoc.coursePrice,
        enrollmentStatus: courseDoc.enrollmentStatus,
        createdAt: courseDoc.createdAt,
        purchasedAt
    };
}

async function purchaseCourse(userId, courseId) {
    if (!isValidObjectId(userId) || !isValidObjectId(courseId)) {
        throw new AppError('מזהה משתמש או קורס לא תקין', 400);
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new AppError('הקורס לא נמצא', 404);
    }

    if (course.enrollmentStatus !== 'active') {
        throw new AppError('לא ניתן לרכוש קורס שסגור להרשמה', 400);
    }

    const existingPurchase = await CoursePurchase.findOne({
        user: userId,
        course: courseId
    });

    if (existingPurchase) {
        throw new AppError('הקורס כבר נרכש על ידי המשתמש', 400);
    }

    const purchase = await CoursePurchase.create({
        user: userId,
        course: courseId
    });

    const currentEnrollment = Number(course.currentEnrollment) || 0;
    course.currentEnrollment = currentEnrollment + 1;
    await course.save();

    return mapCourse(course, purchase.purchasedAt);
}

async function getPurchasedCourses(userId) {
    if (!isValidObjectId(userId)) {
        throw new AppError('מזהה משתמש לא תקין', 400);
    }

    const purchases = await CoursePurchase.find({ user: userId })
        .populate('course')
        .sort({ purchasedAt: -1 });

    return purchases
        .filter((purchase) => Boolean(purchase.course))
        .map((purchase) => mapCourse(purchase.course, purchase.purchasedAt));
}

module.exports = {
    purchaseCourse,
    getPurchasedCourses
};
