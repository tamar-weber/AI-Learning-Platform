require('dotenv').config(); // טוען את קובץ ה-.env

const express = require('express');
const cors = require('cors');
const { generateLesson } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// נתיב לבדיקה שהשרת עובד
app.get('/', (req, res) => {
    res.json({ message: '🎓 AI Learning Platform Server is running!' });
});

// נתיב לקבלת שיעור מה-AI
app.post('/api/generate-lesson', async (req, res) => {
    try {
        const { prompt, category, subCategory } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'חסר prompt' });
        }

        console.log(`📚 מייצר שיעור: "${prompt}" בנושא ${category}-${subCategory}`);

        const lesson = await generateLesson(prompt, category, subCategory);

        res.json({
            success: true,
            lesson: lesson,
            prompt: prompt,
            category: category,
            subCategory: subCategory
        });
    } catch (error) {
        console.error('שגיאה:', error);
        res.status(500).json({ error: 'שגיאה ביצירת השיעור' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔑 OpenAI מחובר: ${process.env.OPENAI_API_KEY ? 'כן' : 'לא'}`);
});