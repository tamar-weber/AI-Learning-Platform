const mongoose = require('mongoose');
const Notification = require('../middleware/Notification');
const AppError = require('../utils/appError');
const { logActivity } = require('./userActivityService');

function toObjectId(value, fieldName) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`${fieldName} לא תקין`, 400);
    }

    return new mongoose.Types.ObjectId(value);
}

function mapNotification(notificationDoc) {
    return {
        id: notificationDoc._id,
        title: notificationDoc.title,
        message: notificationDoc.message,
        type: notificationDoc.type,
        courseId: notificationDoc.courseId,
        userId: notificationDoc.userId,
        isRead: notificationDoc.isRead,
        createdAt: notificationDoc.createdAt
    };
}

async function createNotification({ userId, title, message, type, courseId = null }) {
    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    const courseObjectId = courseId ? toObjectId(courseId, 'מזהה קורס') : null;

    const created = await Notification.create({
        userId: userObjectId,
        title,
        message,
        type,
        courseId: courseObjectId,
        isRead: false
    });

    await logActivity(userObjectId, 'notification', `נשלחה התראה חדשה מסוג ${type}`, courseObjectId);

    return mapNotification(created);
}

async function createBulkNotifications({ userIds, title, message, type, courseId = null }) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
    }

    const uniqueUserIds = [...new Set(userIds.map((id) => String(id)))];
    const courseObjectId = courseId ? toObjectId(courseId, 'מזהה קורס') : null;

    const docs = uniqueUserIds.map((id) => ({
        userId: toObjectId(id, 'מזהה משתמש'),
        title,
        message,
        type,
        courseId: courseObjectId,
        isRead: false
    }));

    const created = await Notification.insertMany(docs, { ordered: false });

    await Promise.allSettled(
        docs.map((doc) => logActivity(doc.userId, 'notification', `נשלחה התראה חדשה מסוג ${type}`, doc.courseId))
    );

    return created.map(mapNotification);
}

async function getUserNotifications({ userId, page = 1, limit = 10 }) {
    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 50) : 10;
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [items, total] = await Promise.all([
        Notification.find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(normalizedLimit),
        Notification.countDocuments({ userId: userObjectId })
    ]);

    return {
        items: items.map(mapNotification),
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / normalizedLimit), 1)
        }
    };
}

async function getUnreadCount(userId) {
    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    return Notification.countDocuments({ userId: userObjectId, isRead: false });
}

async function markAsRead({ userId, notificationId }) {
    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    const notificationObjectId = toObjectId(notificationId, 'מזהה התראה');

    const updated = await Notification.findOneAndUpdate(
        { _id: notificationObjectId, userId: userObjectId },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!updated) {
        throw new AppError('התראה לא נמצאה', 404);
    }

    return mapNotification(updated);
}

async function markAllAsRead(userId) {
    const userObjectId = toObjectId(userId, 'מזהה משתמש');
    const result = await Notification.updateMany(
        { userId: userObjectId, isRead: false },
        { $set: { isRead: true } }
    );

    return {
        modifiedCount: result.modifiedCount
    };
}

module.exports = {
    createNotification,
    createBulkNotifications,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};