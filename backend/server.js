require('dotenv').config();
const connectDB = require('./config/db');
connectDB();

const express = require('express');
const cors = require('cors');
const lessonController = require('./controllers/lessonController');

const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const myCoursesRoutes = require('./routes/myCoursesRoutes');



const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));




app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/my-courses', myCoursesRoutes);
app.post('/api/generate-lesson', lessonController.generateLesson);



app.use((err, req, res, next) => {
    console.error('❌ שגיאה כללית:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'שגיאה קריטית ביצירת השיעור';

    res.status(statusCode).json({
        error: message,
        statusCode
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('🔑 OpenAI מחובר:', process.env.OPENAI_API_KEY ? 'כן ✅' : 'לא ❌');
    console.log('📚 מערכת הלמידה מוכנה!');
   
});