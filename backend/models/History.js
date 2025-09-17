const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    prompt: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: "כללי"
    },
    sub_category: {
        type: String,
        default: ""
    },
    response: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("History", HistorySchema);
