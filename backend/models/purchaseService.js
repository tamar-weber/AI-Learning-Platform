const mongoose = require('mongoose');
const CoursePurchase = require('../middleware/CoursePurchase');
const AppError = require('../utils/appError');

function ensureObjectId(value) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError('מזהה משתמש לא תקין', 400);
    }

    return new mongoose.Types.ObjectId(value);
}

function mapPurchase(purchaseDoc) {
    const course = purchaseDoc.course || null;

    return {
        id: purchaseDoc._id,
        courseId: course?._id || null,
        courseName: course?.courseName || 'קורס לא זמין',
        price: Number(purchaseDoc.amountPaid || course?.coursePrice || 0),
        paymentMethod: purchaseDoc.paymentMethod || purchaseDoc.paymentProvider || 'unknown',
        transactionId: purchaseDoc.stripePaymentIntentId || purchaseDoc.stripeSessionId || '',
        status: purchaseDoc.paymentStatus,
        date: purchaseDoc.purchasedAt,
        currency: purchaseDoc.currency || 'ILS'
    };
}

async function getPurchasesForUser({ userId, page = 1, limit = 10 }) {
    const userObjectId = ensureObjectId(userId);
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 50) : 10;
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [items, total] = await Promise.all([
        CoursePurchase.find({ user: userObjectId })
            .populate('course')
            .sort({ purchasedAt: -1 })
            .skip(skip)
            .limit(normalizedLimit),
        CoursePurchase.countDocuments({ user: userObjectId })
    ]);

    return {
        items: items.map(mapPurchase),
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / normalizedLimit), 1)
        }
    };
}

module.exports = {
    getPurchasesForUser
};
