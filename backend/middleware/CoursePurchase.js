const mongoose = require('mongoose');

const CoursePurchaseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true
        },
        purchasedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

CoursePurchaseSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CoursePurchase', CoursePurchaseSchema);
