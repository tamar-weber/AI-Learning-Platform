const adminDashboardService = require('../models/adminDashboardService');

async function getDashboard(req, res, next) {
    try {
        const dashboard = await adminDashboardService.getDashboardData({
            rangeStart: req.query.rangeStart,
            rangeEnd: req.query.rangeEnd
        });

        res.json(dashboard);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getDashboard
};
