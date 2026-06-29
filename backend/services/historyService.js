const mongoose = require('mongoose');
const History = require('../models/History');
const AppError = require('../utils/appError');

function resolveObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value)
        ? new mongoose.Types.ObjectId(value)
        : value;
}

async function addHistory({ userId, prompt, category = 'כללי', subCategory = '', response }) {
    if (!userId || !prompt || !response) {
        throw new AppError('חסרים שדות נדרשים לרישום היסטוריה', 400);
    }

    const historyRecord = new History({
        user: resolveObjectId(userId),
        prompt,
        category,
        subCategory,
        response
    });

    return historyRecord.save();
}

async function getHistoryForUser(userId) {
    if (!userId) {
        throw new AppError('מזהה משתמש אינו יכול להיות ריק', 400);
    }

    const query = mongoose.Types.ObjectId.isValid(userId)
        ? { user: resolveObjectId(userId) }
        : { user: userId };

    return History.find(query).sort({ createdAt: -1 });
}

module.exports = {
    addHistory,
    getHistoryForUser
};
