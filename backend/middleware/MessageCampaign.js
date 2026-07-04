const mongoose = require('mongoose');

const MessageCampaignSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
            trim: true
        },
        body: {
            type: String,
            required: true,
            trim: true
        },
        audienceType: {
            type: String,
            required: true,
            enum: ['all_users', 'course_enrollees', 'category', 'single_user']
        },
        audienceFilter: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        sentAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        recipientCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

MessageCampaignSchema.index({ sentAt: -1 });

module.exports = mongoose.model('MessageCampaign', MessageCampaignSchema);
