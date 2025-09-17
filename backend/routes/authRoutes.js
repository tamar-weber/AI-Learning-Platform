const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🟢 הרשמה
router.post("/register", async (req, res) => {
    try {
        console.log("📥 נתונים שהתקבלו בהרשמה:", req.body);
        console.log("👉 name:", req.body.name);
        console.log("👉 phone:", req.body.phone);
        console.log("👉 email:", req.body.email);
        console.log("👉 idNumber:", req.body.idNumber);


        const { name, idNumber, phone, email } = req.body;

      
        if (!name || !idNumber || !phone || !email) {
            return res.status(400).json({ error: "נא למלא שם, תעודת זהות, טלפון ואימייל" });
        }

        // בדיקה אם כבר קיים משתמש לפי תעודת זהות או מייל
        const existingUser = await User.findOne({ 
            $or: [{ idNumber }, { email }]
        });
        if (existingUser) {
            return res.status(400).json({ error: "משתמש עם תעודת זהות או אימייל זה כבר רשום" });
        }

        // יצירת משתמש חדש
        const newUser = new User({ name, idNumber, phone, email });
        await newUser.save();

        console.log("✅ משתמש נוצר בהצלחה:", newUser);
        res.status(201).json(newUser);

    } catch (error) {
        console.error("❌ שגיאת שרת בהרשמה:", error.message, error);
res.status(500).json({ error: error.message || "שגיאת שרת" });

    }
});

// 🟢 התחברות
router.post("/login", async (req, res) => {
    try {
        console.log("📥 נתונים שהתקבלו בלוגין:", req.body);

        const { idNumber, email } = req.body;

        if (!idNumber && !email) {
            return res.status(400).json({ error: "נא למלא אימייל או תעודת זהות" });
        }

        // חיפוש משתמש
        const user = await User.findOne({ 
            $or: [{ idNumber }, { email }]
        });
        if (!user) {
            return res.status(400).json({ error: "משתמש לא נמצא במערכת" });
        }

        console.log("✅ התחברות הצליחה:", user);
        res.json(user);

    } catch (error) {
        console.error("❌ שגיאת שרת בהתחברות:", error);
        res.status(500).json({ error: "שגיאת שרת" });
    }
});

module.exports = router;
