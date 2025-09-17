const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    idNumber: { type: String, required: true, unique: true },
    role: { type: String, default: 'student' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);