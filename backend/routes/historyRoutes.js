    // historyRoutes.js
    const express = require("express");
    const router = express.Router();
    const History = require("../models/History");

    // ✅ שליפת היסטוריה לפי user_id
    router.get("/user/:userId", async (req, res) => {
        try {
            const { userId } = req.params;
            const history = await History.find({ user_id: userId });
            
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
                user_id,
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
