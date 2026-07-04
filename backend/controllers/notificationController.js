const notificationService = require('../models/notificationService');

async function getNotifications(req, res, next) {
    try {
        const data = await notificationService.getUserNotifications({
            userId: req.user._id,
            page: req.query.page,
            limit: req.query.limit
        });

        res.json(data);
    } catch (error) {
        next(error);
    }
}

async function getUnreadCount(req, res, next) {
    try {
        const unreadCount = await notificationService.getUnreadCount(req.user._id);
        res.json({ unreadCount });
    } catch (error) {
        next(error);
    }
}

async function markNotificationAsRead(req, res, next) {
    try {
        const notification = await notificationService.markAsRead({
            userId: req.user._id,
            notificationId: req.params.id
        });

        res.json(notification);
    } catch (error) {
        next(error);
    }
}

async function markAllNotificationsAsRead(req, res, next) {
    try {
        const result = await notificationService.markAllAsRead(req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
};