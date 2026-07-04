const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            enum: ['course_created', 'enrollment', 'payment', 'admin_message', 'system_update']
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);