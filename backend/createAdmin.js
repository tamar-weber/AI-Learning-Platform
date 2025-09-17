require('dotenv').config();
const mongoose = require('mongoose');

// התחברות למונגו
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// מודל המשתמש
const User = mongoose.model('User', {
    name: String,
    phone: String,
    email: String,
    idNumber: String,
    role: { type: String, default: 'student' }
});

// פונקציה ליצירת המנהל
async function createAdmin() {
    await connectDB();
    
    try {
        // בדיקה אם המנהל כבר קיים
        const existingAdmin = await User.findOne({ idNumber: "11111111" });
        
        if (existingAdmin) {
            console.log('✅ המנהל כבר קיים במערכת:', existingAdmin);
        } else {
            // יצירת המנהל
            const admin = new User({
                name: "תמר המנהלת",
                phone: "050-1234567",
                email: "admin@example.com",
                idNumber: "111111111",
                role: "admin"
            });
            
            await admin.save();
            console.log('✅ המנהל נוצר בהצלחה:', admin);
        }
    } catch (error) {
        console.error('❌ שגיאה ביצירת המנהל:', error);
    }
    
    mongoose.disconnect();
}

createAdmin();