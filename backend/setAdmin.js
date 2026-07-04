require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const User = require('./middleware/User');

const SALT_ROUNDS = 10;

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
    const password = getArgValue('--password', process.env.ADMIN_PASSWORD || 'Admin12345');

    if (!password || password.length < 8) {
      throw new Error('יש לספק סיסמה באורך 8 תווים לפחות דרך --password או ADMIN_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let user = await User.findOne({ idNumber }) || await User.findOne({ name });

    if (user) {
      user.role = 'admin';
      user.email = email;
      user.phone = phone;
      user.password = hashedPassword;
      await user.save();
      console.log('✅ עדכון משתמש קיים ל-admin:', user.name);
      return;
    }

    user = new User({
      name,
      idNumber,
      email,
      phone,
      role: 'admin',
      password: hashedPassword
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
