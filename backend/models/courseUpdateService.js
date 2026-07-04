const mongoose = require('mongoose');
const Course = require('../middleware/Course');
const CoursePurchase = require('../middleware/CoursePurchase');
const AppError = require('../utils/appError');
const { sendCourseUpdateEmail } = require('./emailService');
const { createBulkNotifications } = require('./notificationService');

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

function mapCourse(courseDoc) {
    return {
        id: courseDoc._id,
        courseName: courseDoc.courseName,
        courseDescription: courseDoc.courseDescription,
        category: courseDoc.category,
        lessonsCount: courseDoc.lessonsCount,
        coursePrice: courseDoc.coursePrice
    };
}

async function sendCourseUpdateToEnrolledUsers(courseId) {
    if (!isValidObjectId(courseId)) {
        throw new AppError('מזהה קורס לא תקין', 400);
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new AppError('הקורס לא נמצא', 404);
    }

    const purchases = await CoursePurchase.find({ course: courseId }).populate('user', 'name email');
    const recipients = purchases
        .map((purchase) => purchase.user)
        .filter((user) => Boolean(user && user._id && user.email));

    if (recipients.length === 0) {
        return {
            courseId,
            recipientsCount: 0,
            sentSuccessfully: 0,
            failed: 0,
            notificationCreatedCount: 0
        };
    }

    const courseData = mapCourse(course);

    const emailResults = await Promise.allSettled(
        recipients.map((recipient) => sendCourseUpdateEmail({
            to: recipient.email,
            recipientName: recipient.name,
            course: courseData
        }))
    );

    const sentSuccessfully = emailResults.filter((result) => result.status === 'fulfilled').length;
    const failed = emailResults.length - sentSuccessfully;

    const notificationPayload = {
        userIds: recipients.map((recipient) => String(recipient._id)),
        title: `עדכון בקורס ${course.courseName}`,
        message: `עודכנו פרטי הקורס "${course.courseName}". היכנסו לצפייה בפרטים החדשים.`,
        type: 'course_created',
        courseId: course._id
    };

    let createdNotifications = [];

    try {
        createdNotifications = await createBulkNotifications(notificationPayload);
    } catch (error) {
        console.error('Failed to create bulk notifications for course update:', error.message);
    }

    return {
        courseId,
        recipientsCount: recipients.length,
        sentSuccessfully,
        failed,
        notificationCreatedCount: createdNotifications.length
    };
}

module.exports = {
    sendCourseUpdateToEnrolledUsers
};