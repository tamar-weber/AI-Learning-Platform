// backend/setAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const nameArg = process.argv[2] || 'תמר המנהלת';
    const idNumberArg = process.argv[3] || '111111111';

    let user = await User.findOne({ idNumber: idNumberArg }) || await User.findOne({ name: nameArg });

    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('✅ עדכון משתמש קיים ל־admin:', user);
    } else {
      user = new User({
        name: nameArg,
        idNumber: idNumberArg,
        email: `${idNumberArg}@example.com`,
        phone: '0500000000',
        role: 'admin'
      });
      await user.save();
      console.log('✅ נוצר משתמש מנהל חדש:', user);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ שגיאה:', err);
    process.exit(1);
  }
}

run();
