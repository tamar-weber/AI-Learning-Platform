const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
            default: "כללי",
            trim: true
        },
        subCategory: {
            type: String,
            default: "",
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

HistorySchema.index({ user: 1, createdAt: -1 });
HistorySchema.index({ category: 1 });

module.exports = mongoose.model("History", HistorySchema);
