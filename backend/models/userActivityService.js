const mongoose = require('mongoose');
const UserActivity = require('../middleware/UserActivity');
const AppError = require('../utils/appError');

function toObjectId(value, fieldName) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`${fieldName} לא תקין`, 400);
    }

    return new mongoose.Types.ObjectId(value);
}

function mapActivity(activityDoc) {
    return {
        id: activityDoc._id,
        userId: activityDoc.userId,
        type: activityDoc.type,
        description: activityDoc.description,
        timestamp: activityDoc.timestamp,
        courseId: activityDoc.courseId
    };
}

async function logActivity(userId, type, description, courseId = null) {
    if (!userId || !type || !description) {
        throw new AppError('חסרים נתונים לרישום פעילות משתמש', 400);
    }

    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    const courseObjectId = courseId ? toObjectId(courseId, 'מזהה קורס') : null;

    const created = await UserActivity.create({
        userId: userObjectId,
        type,
        description,
        courseId: courseObjectId,
        timestamp: new Date()
    });

    return mapActivity(created);
}

async function getActivitiesForUser({ userId, page = 1, limit = 10 }) {
    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 50) : 10;
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [items, total] = await Promise.all([
        UserActivity.find({ userId: userObjectId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(normalizedLimit),
        UserActivity.countDocuments({ userId: userObjectId })
    ]);

    return {
        items: items.map(mapActivity),
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / normalizedLimit), 1)
        }
    };
}

module.exports = {
    logActivity,
    getActivitiesForUser
};