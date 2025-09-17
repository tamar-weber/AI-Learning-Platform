// historyRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const History = require("../models/History");

// ✅ שליפת היסטוריה לפי user_id
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        let history = [];

        // ננסה קודם לחפש לפי ObjectId
        if (mongoose.Types.ObjectId.isValid(userId)) {
            history = await History.find({ user_id: new mongoose.Types.ObjectId(userId) });
        }

        // אם לא מצאנו כלום – ננסה לחפש כמחרוזת (למקרה שזה נשמר כ-String)
        if (!history.length) {
            history = await History.find({ user_id: userId });
        }

        if (!history.length) {
            return res.status(404).json({ error: "לא נמצאה היסטוריה למשתמש הזה" });
        }

        res.json(history);
    } catch (err) {
        console.error("❌ שגיאה בשליפת היסטוריה:", err);
        res.status(500).json({ error: "שגיאה בשרת" });
    }
});

// ✅ הוספה להיסטוריה
router.post("/add-to-history", async (req, res) => {
    try {
        const { user_id, prompt, category, sub_category, response } = req.body;

        if (!user_id || !prompt || !response) {
            return res.status(400).json({ error: "חסרים נתונים נדרשים" });
        }

        const newHistory = new History({
            user_id: mongoose.Types.ObjectId.isValid(user_id) ? new mongoose.Types.ObjectId(user_id) : user_id,
            prompt,
            category,
            sub_category,
            response,
            createdAt: new Date()
        });

        await newHistory.save();
        res.json({ success: true, history: newHistory });
    } catch (err) {
        console.error("❌ שגיאה בהוספת היסטוריה:", err);
        res.status(500).json({ error: "שגיאה בשרת" });
    }
});

module.exports = router;
