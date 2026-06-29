
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`🗄️ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(error); process.exit(1); // סיום התהליך אם נכשל
    }
};

module.exports = connectDB;