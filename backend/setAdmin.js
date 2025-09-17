// backend/setAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');

// התאימי את הנתיב אם המודל בנתיב שונה
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    // ניתן להעביר שם ותעודת זהות כפרמטרים
    const nameArg = process.argv[2] || 'תמר המנהלת';
    const idNumberArg = process.argv[3] || '111111111';

    // חפש לפי תעודת זהות או שם
    let user = await User.findOne({ idNumber: idNumberArg }) || await User.findOne({ name: nameArg });

    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('✅ עדכון משתמש קיים ל־admin:', user);
    } else {
      // שדות phone & email דרושים במודל שלך — מלאי ערכים סבירים
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
