const purchaseService = require('../models/purchaseService');

async function getMyPurchases(req, res, next) {
    try {
        const data = await purchaseService.getPurchasesForUser({
            userId: req.user._id,
            page: req.query.page,
            limit: req.query.limit
        });

        res.json(data);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyPurchases
};
