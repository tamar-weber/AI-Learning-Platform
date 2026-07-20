// One-off script to populate a fresh local database with:
//   1. A fixed admin user (email/password documented in README)
//   2. A handful of sample courses, so the UI has real content to show
//
// Safe to re-run - it upserts by email / course name instead of creating
// duplicates. Run with: `node seed.js`

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./middleware/User');
const Course = require('./middleware/Course');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin12345';

const SAMPLE_COURSES = [
    {
        courseName: 'יסודות React',
        lecturerName: 'דנה כהן',
        courseDescription: 'קורס מקיף ללימוד React מהבסיס - קומפוננטות, state, hooks ובניית אפליקציה מלאה.',
        lessonsCount: 12,
        category: 'פיתוח Frontend',
        coursePrice: 349,
        courseStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        enrollmentCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
        courseName: 'Node.js ו-Express למתחילים',
        lecturerName: 'יוסי לוי',
        courseDescription: 'בניית שרתי API עם Node.js, Express ו-MongoDB, כולל אימות משתמשים ואבטחה.',
        lessonsCount: 10,
        category: 'פיתוח Backend',
        coursePrice: 399,
        courseStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        enrollmentCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    },
    {
        courseName: 'מבוא ל-AI ולמידת מכונה',
        lecturerName: 'מיכל אברהם',
        courseDescription: 'הכרות עם מושגי בסיס ב-AI, מודלי שפה, ואיך משלבים אותם באפליקציות אמיתיות.',
        lessonsCount: 8,
        category: 'AI ולמידת מכונה',
        coursePrice: 449,
        courseStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        enrollmentCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    }
];

async function seedAdmin() {
    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
        console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
        return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
        name: 'Admin Demo',
        phone: '0500000000',
        email: ADMIN_EMAIL,
        idNumber: '000000000',
        role: 'admin',
        password: hashedPassword
    });

    console.log(`✅ Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

async function seedCourses() {
    for (const courseData of SAMPLE_COURSES) {
        const existing = await Course.findOne({ courseName: courseData.courseName });

        if (existing) {
            console.log(`ℹ️  Course already exists: ${courseData.courseName}`);
            continue;
        }

        await Course.create(courseData);
        console.log(`✅ Course created: ${courseData.courseName}`);
    }
}

async function run() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-learning-platform';

    await mongoose.connect(mongoUri);
    console.log('🗄️  Connected to MongoDB for seeding');

    await seedAdmin();
    await seedCourses();

    await mongoose.disconnect();
    console.log('🌱 Seeding complete.');
}

run().catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exit(1);
});
