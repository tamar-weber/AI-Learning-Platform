const mongoose = require('mongoose');
const User = require('../middleware/User');
const Course = require('../middleware/Course');
const CoursePurchase = require('../middleware/CoursePurchase');
const MessageCampaign = require('../middleware/MessageCampaign');
const AppError = require('../utils/appError');
const { createBulkNotifications } = require('./notificationService');
const { sendAdminCampaignEmail } = require('./emailService');

function toObjectId(value, fieldName) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`${fieldName} לא תקין`, 400);
    }

    return new mongoose.Types.ObjectId(value);
}

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

async function resolveRecipients({ audienceType, audienceFilter }) {
    if (audienceType === 'all_users') {
        const users = await User.find({ role: 'student' }).select('_id name email');
        return users.map((user) => ({ _id: user._id, name: user.name, email: user.email }));
    }

    if (audienceType === 'single_user') {
        const userId = toObjectId(audienceFilter?.userId, 'מזהה משתמש');
        const user = await User.findById(userId).select('_id name email role');

        if (!user) {
            throw new AppError('המשתמש לא נמצא', 404);
        }

        if (user.role !== 'student') {
            throw new AppError('ניתן לשלוח הודעה רק למשתמש תלמיד', 400);
        }

        return [{ _id: user._id, name: user.name, email: user.email }];
    }

    if (audienceType === 'category') {
        const category = normalizeText(audienceFilter?.category);

        if (!category) {
            throw new AppError('נדרשת קטגוריה לקהל היעד', 400);
        }

        const courses = await Course.find({ category }).select('_id');
        const courseIds = courses.map((course) => course._id);

        if (courseIds.length === 0) {
            return [];
        }

        const purchases = await CoursePurchase.distinct('user', { course: { $in: courseIds } });
        if (purchases.length === 0) {
            return [];
        }

        const users = await User.find({ _id: { $in: purchases }, role: 'student' }).select('_id name email');
        return users.map((user) => ({ _id: user._id, name: user.name, email: user.email }));
    }

    if (audienceType === 'course_enrollees') {
        const courseId = toObjectId(audienceFilter?.courseId, 'מזהה קורס');
        const purchases = await CoursePurchase.find({ course: courseId }).populate('user', 'name email role');
        return purchases
            .map((purchase) => purchase.user)
            .filter((user) => Boolean(user) && user.role === 'student')
            .map((user) => ({ _id: user._id, name: user.name, email: user.email }));
    }

    throw new AppError('סוג קהל היעד לא תקין', 400);
}

async function createCampaign({ sentBy, subject, body, audienceType, audienceFilter }) {
    const normalizedSubject = normalizeText(subject);
    const normalizedBody = normalizeText(body);

    if (!normalizedSubject || !normalizedBody || !audienceType) {
        throw new AppError('חסרים שדות נדרשים לקמפיין הודעות', 400);
    }

    const recipients = await resolveRecipients({ audienceType, audienceFilter });

    if (recipients.length === 0) {
        throw new AppError('לא נמצאו נמענים לקמפיין', 400);
    }

    const sendResults = await Promise.allSettled(
        recipients.map((recipient) => sendAdminCampaignEmail({ to: recipient.email, subject: normalizedSubject, body: normalizedBody }))
    );

    const successfulRecipientIds = [];
    const failedRecipientIds = [];

    sendResults.forEach((result, index) => {
        const recipientId = recipients[index]._id;
        if (result.status === 'fulfilled') {
            successfulRecipientIds.push(recipientId);
        } else {
            failedRecipientIds.push(recipientId);
        }
    });

    if (successfulRecipientIds.length > 0) {
        await createBulkNotifications({
            userIds: successfulRecipientIds,
            title: normalizedSubject,
            message: normalizedBody,
            type: 'admin_message'
        });
    }

    const campaign = await MessageCampaign.create({
        subject: normalizedSubject,
        body: normalizedBody,
        audienceType,
        audienceFilter: audienceFilter || null,
        sentBy,
        sentAt: new Date(),
        recipientCount: recipients.length
    });

    return {
        campaign: {
            id: campaign._id,
            subject: campaign.subject,
            body: campaign.body,
            audienceType: campaign.audienceType,
            audienceFilter: campaign.audienceFilter,
            sentBy: campaign.sentBy,
            sentAt: campaign.sentAt,
            recipientCount: campaign.recipientCount
        },
        recipientCount: recipients.length,
        sentCount: successfulRecipientIds.length,
        failedCount: failedRecipientIds.length
    };
}

async function getCampaignHistory({ page = 1, limit = 10 }) {
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 50) : 10;
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [items, total] = await Promise.all([
        MessageCampaign.find()
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(normalizedLimit)
            .populate('sentBy', 'name email'),
        MessageCampaign.countDocuments()
    ]);

    return {
        items: items.map((campaign) => ({
            id: campaign._id,
            subject: campaign.subject,
            body: campaign.body,
            audienceType: campaign.audienceType,
            audienceFilter: campaign.audienceFilter,
            sentBy: campaign.sentBy,
            sentAt: campaign.sentAt,
            recipientCount: campaign.recipientCount
        })),
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / normalizedLimit), 1)
        }
    };
}

module.exports = {
    createCampaign,
    getCampaignHistory
};
