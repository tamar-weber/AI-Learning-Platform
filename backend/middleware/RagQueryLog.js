const mongoose = require('mongoose');

const RagQueryLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        query: {
            type: String,
            required: true,
            trim: true
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        score: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

RagQueryLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RagQueryLog', RagQueryLogSchema);
