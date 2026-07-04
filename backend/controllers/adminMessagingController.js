const adminMessagingService = require('../models/adminMessagingService');

async function createCampaign(req, res, next) {
    try {
        const result = await adminMessagingService.createCampaign({
            sentBy: req.user._id,
            subject: req.body.subject,
            body: req.body.body,
            audienceType: req.body.audienceType,
            audienceFilter: req.body.audienceFilter
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

async function getCampaignHistory(req, res, next) {
    try {
        const result = await adminMessagingService.getCampaignHistory({
            page: req.query.page,
            limit: req.query.limit
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCampaign,
    getCampaignHistory
};
