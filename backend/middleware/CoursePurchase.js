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
        },
        paymentProvider: {
            type: String,
            default: 'manual'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'paid'
        },
        stripeSessionId: {
            type: String,
            sparse: true
        },
        stripePaymentIntentId: {
            type: String,
            index: true,
            sparse: true
        },
        paymentMethod: {
            type: String,
            default: ''
        },
        amountPaid: {
            type: Number,
            min: 0,
            default: 0
        },
        currency: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

CoursePurchaseSchema.index({ user: 1, course: 1 }, { unique: true });
CoursePurchaseSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('CoursePurchase', CoursePurchaseSchema);
