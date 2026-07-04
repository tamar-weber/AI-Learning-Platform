require('dotenv').config();
const connectDB = require('./config/db');
connectDB();

const express = require('express');
const cors = require('cors');
const lessonController = require('./controllers/lessonController');

const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminMessagingRoutes = require('./routes/adminMessagingRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const ragRoutes = require('./routes/ragRoutes');
const authRoutes = require('./routes/authRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const myCoursesRoutes = require('./routes/myCoursesRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userActivityRoutes = require('./routes/userActivityRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');
const ragService = require('./models/ragService');



const app = express();
const PORT = process.env.PORT || 8000;

app.use('/api/webhooks', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));




app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/messages', adminMessagingRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/my-courses', myCoursesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', userActivityRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/rag', ragRoutes);
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

ragService.bootstrapKnowledgeBase().catch((error) => {
    console.error('Failed to seed RAG documents:', error.message);
});