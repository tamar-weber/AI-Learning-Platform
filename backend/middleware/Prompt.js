const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        prompt: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            default: 'כללי',
            trim: true
        },
        subCategory: {
            type: String,
            default: '',
            trim: true
        },
        response: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

PromptSchema.index({ user: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Prompt', PromptSchema);