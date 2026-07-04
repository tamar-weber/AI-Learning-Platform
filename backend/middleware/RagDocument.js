const mongoose = require('mongoose');

const RagDocumentSchema = new mongoose.Schema(
    {
        sourceType: {
            type: String,
            required: true,
            index: true
        },
        sourceId: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        embedding: {
            type: [Number],
            required: true
        },
        updatedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { versionKey: false }
);

RagDocumentSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model('RagDocument', RagDocumentSchema);
