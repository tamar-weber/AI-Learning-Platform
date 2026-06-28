require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

async function createAdmin() {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({ idNumber: '111111111' });

        if (existingAdmin) {
            console.log('✅ המנהל כבר קיים במערכת:', existingAdmin);
        } else {
            const admin = new User({
                name: 'תמר המנהלת',
                phone: '050-1234567',
                email: 'admin@example.com',
                idNumber: '111111111',
                role: 'admin'
            });

            await admin.save();
            console.log('✅ המנהל נוצר בהצלחה:', admin);
        }
    } catch (error) {
        console.error('❌ שגיאה ביצירת המנהל:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();