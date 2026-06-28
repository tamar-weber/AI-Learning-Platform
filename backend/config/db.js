
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        // חיבור ל־MongoDB מה־.env (שדה MONGODB_URI)
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // הפרמטרים האלו כבר לא חובה בגרסאות חדשות, אפשר להוריד אם מציקים אזהרות
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`🗄️ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(error); process.exit(1); // סיום התהליך אם נכשל
    }
};

module.exports = connectDB;