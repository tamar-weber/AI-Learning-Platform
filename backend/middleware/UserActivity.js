const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        type: {
            type: String,
            required: true,
            enum: ['login', 'enrollment', 'purchase', 'course_completion', 'profile_update', 'password_change', 'notification']
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null
        }
    },
    { timestamps: true }
);

UserActivitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);