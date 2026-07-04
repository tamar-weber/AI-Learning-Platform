const ragService = require('../models/ragService');

async function askAssistant(req, res, next) {
    try {
        const result = await ragService.answerQuery({
            userId: req.user._id,
            query: req.body.query
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    askAssistant
};
