const express = require("express");
const router = express.Router();

// ⭐ הרחבנו את הקטגוריות
const categories = [
    { id: 1, name: "מדעים" },
    { id: 2, name: "היסטוריה" },
    { id: 3, name: "טכנולוגיה" },
    { id: 4, name: "אמנות ותרבות" },
    { id: 5, name: "ספורט" },
    { id: 6, name: "גאוגרפיה" },
    { id: 7, name: "כלכלה ועסקים" }
];

const subCategories = [
    // מדעים
    { id: 1, name: "חלל ואסטרונומיה", category_id: 1 },
    { id: 2, name: "פיזיקה", category_id: 1 },
    { id: 3, name: "כימיה", category_id: 1 },
    { id: 4, name: "ביולוגיה", category_id: 1 },
    
    // היסטוריה
    { id: 5, name: "מלחמת העולם השנייה", category_id: 2 },
    { id: 6, name: "העת העתיקה", category_id: 2 },
    { id: 7, name: "ימי הביניים", category_id: 2 },
    { id: 8, name: "המהפכה התעשייתית", category_id: 2 },

    // טכנולוגיה
    { id: 9, name: "בינה מלאכותית", category_id: 3 },
    { id: 10, name: "פיתוח אפליקציות", category_id: 3 },
    { id: 11, name: "אבטחת מידע", category_id: 3 },
    { id: 12, name: "חומרה ומחשבים", category_id: 3 },
    
    // אמנות ותרבות
    { id: 13, name: "ציור ורישום", category_id: 4 },
    { id: 14, name: "מוזיקה", category_id: 4 },
    { id: 15, name: "קולנוע וטלוויזיה", category_id: 4 },
    { id: 16, name: "ספרות ושירה", category_id: 4 },
    
    // ספורט
    { id: 17, name: "כדורגל", category_id: 5 },
    { id: 18, name: "כדורסל", category_id: 5 },
    { id: 19, name: "אתלטיקה", category_id: 5 },

    // גאוגרפיה
    { id: 20, name: "יבשות ומדינות", category_id: 6 },
    { id: 21, name: "תופעות טבע", category_id: 6 },

    // כלכלה
    { id: 22, name: "שוק ההון", category_id: 7 },
    { id: 23, name: "יזמות", category_id: 7 },
];

// קבלת כל הקטגוריות
router.get("/", (req, res) => {
    res.json(categories);
});

// קבלת תת-קטגוריות לפי קטגוריה
router.get("/subcategories/:categoryId", (req, res) => {
    const categoryId = parseInt(req.params.categoryId);
    const subs = subCategories.filter(sc => sc.category_id === categoryId);
    res.json(subs);
});

// ⭐ מודול לייצוא כדי שנוכל להשתמש בו בקבצים אחרים
module.exports = router;
module.exports.categories = categories;
module.exports.subCategories = subCategories;