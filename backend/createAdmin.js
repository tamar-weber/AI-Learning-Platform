require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

const adminData = {
    name: process.env.ADMIN_NAME || 'תמר המנהלת',
    phone: process.env.ADMIN_PHONE || '050-1234567',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    idNumber: process.env.ADMIN_ID_NUMBER || '111111111',
    role: 'admin'
};

async function createAdmin() {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({ idNumber: adminData.idNumber });

        if (existingAdmin) {
            console.log('✅ המנהל כבר קיים במערכת:', existingAdmin.name);
            return;
        }

        const admin = new User(adminData);
        await admin.save();

        console.log('✅ המנהל נוצר בהצלחה:', admin.name);
    } catch (error) {
        console.error('❌ שגיאה ביצירת המנהל:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();