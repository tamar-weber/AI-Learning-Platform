const userActivityService = require('../models/userActivityService');

async function getMyActivity(req, res, next) {
    try {
        const data = await userActivityService.getActivitiesForUser({
            userId: req.user._id,
            page: req.query.page,
            limit: req.query.limit
        });

        res.json(data);
    } catch (error) {
        next(error);
    }
}

async function getActivityForUser(req, res, next) {
    try {
        const data = await userActivityService.getActivitiesForUser({
            userId: req.params.userId,
            page: req.query.page,
            limit: req.query.limit
        });

        res.json(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyActivity,
    getActivityForUser
};