require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

function getArgValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

async function setAdminRole() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const name = getArgValue('--name', process.env.ADMIN_NAME || 'תמר המנהלת');
    const idNumber = getArgValue('--idNumber', process.env.ADMIN_ID_NUMBER || '111111111');
    const email = getArgValue('--email', process.env.ADMIN_EMAIL || `${idNumber}@example.com`);
    const phone = getArgValue('--phone', process.env.ADMIN_PHONE || '0500000000');

    let user = await User.findOne({ idNumber }) || await User.findOne({ name });

    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('✅ עדכון משתמש קיים ל-admin:', user.name);
      return;
    }

    user = new User({
      name,
      idNumber,
      email,
      phone,
      role: 'admin'
    });

    await user.save();
    console.log('✅ נוצר משתמש מנהל חדש:', user.name);
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setAdminRole();
