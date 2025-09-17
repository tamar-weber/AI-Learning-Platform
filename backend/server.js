require('dotenv').config();
const connectDB = require('./config/db');
connectDB();

const express = require("express");
const cors = require("cors");
const axios = require("axios"); 

// import של כל הroutes
const lessonRoutes = require("./routes/lessonRoutes");
const historyRoutes = require("./routes/historyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");

const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 8000;

// הוספת כל הroutes
app.use("/api/lessons", lessonRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", authRoutes);
app.use("/api/categories", categoriesRoutes);

// ⭐ route ליצירת שיעור עם AI (מתוקן!)
const { generateLesson } = require('./services/aiService');

app.post('/api/generate-lesson', async (req, res) => {
    try {
        let { prompt, user_id, category_id, sub_category_id, custom_category, custom_sub_category } = req.body;
        
        console.log('📚 מייצר שיעור חדש:', req.body);
        
        if (!prompt || !user_id) {
            return res.status(400).json({ error: 'חסרים נתונים נדרשים' });
        }

        // ⭐ לוגיקה לקביעת שמות הקטגוריות
        let categoryName = "כללי";
        let subCategoryName = "";

        if (category_id && category_id !== 'other') {
            const categories = require('./routes/categoriesRoutes').categories;
            const cat = categories.find(c => c.id == category_id);
            if (cat) categoryName = cat.name;
        } else if (custom_category) {
            categoryName = custom_category;
        }

        if (sub_category_id && sub_category_id !== 'other') {
            const subCategories = require('./routes/categoriesRoutes').subCategories;
            const subCat = subCategories.find(sc => sc.id == sub_category_id);
            if (subCat) subCategoryName = subCat.name;
        } else if (custom_sub_category) {
            subCategoryName = custom_sub_category;
        }
        
        // יצירת השיעור עם AI
        console.log(`🤖 שולח ל-AI: prompt='${prompt}', category='${categoryName}', subCategory='${subCategoryName}'`);
        const lesson = await generateLesson(prompt, categoryName, subCategoryName);
        

        try {
            await axios.post(`http://localhost:${PORT}/api/history/add-to-history`, {
                user_id,
                prompt,
                category: categoryName,
                sub_category: subCategoryName,
                response: lesson
            });
            console.log("✅ השיעור נשמר בהיסטוריה בהצלחה");
        } catch (historyError) {
            console.error('⚠️ שגיאה בשמירת השיעור בהיסטוריה:', historyError.message);
        }
        
        console.log('✅ שיעור נוצר בהצלחה');
        
        res.json({ 
            success: true, 
            lesson: lesson,
            prompt: prompt
        });
        
    } catch (error) {
        console.error('❌ שגיאה כללית ביצירת שיעור:', error);
        res.status(500).json({ error: 'שגיאה קריטית ביצירת השיעור' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('🔑 OpenAI מחובר:', process.env.OPENAI_API_KEY ? 'כן ✅' : 'לא ❌');
    console.log('📚 מערכת הלמידה מוכנה!');
});