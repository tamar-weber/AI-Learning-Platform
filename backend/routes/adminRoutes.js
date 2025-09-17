const express = require("express");
const router = express.Router();

// דמו משתמשים + prompts
let users = [
    { id: 1, name: "תמר", phone: "050-1234567", prompts: ["שאלה 1", "שאלה 2"] },
    { id: 2, name: "דני", phone: "052-7654321", prompts: ["שאלה 3"] },
];

// דמו של כל הprompts למנהל
let allPrompts = [
    { 
        id: 1, 
        user_name: "תמר", 
        category_name: "מדעים", 
        sub_category_name: "פיזיקה",
        prompt: "מה זה חור שחור?", 
        response: "חור שחור הוא אזור בחלל..." 
    },
    { 
        id: 2, 
        user_name: "דני", 
        category_name: "היסטוריה", 
        sub_category_name: "מלחמת העולם השנייה",
        prompt: "מתי התחילה מלחמת העולם השנייה?", 
        response: "מלחמת העולם השנייה התחילה ב-1939..." 
    }
];


router.get("/users", (req, res) => {
    res.json(users);
});


router.get("/all-prompts", (req, res) => {
    res.json(allPrompts);
});

module.exports = router;