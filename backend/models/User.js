const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            minlength: 9
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'אימייל לא תקין']
        },
        idNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 4
        },
        role: {
            type: String,
            enum: ['student', 'admin', 'teacher'],
            default: 'student'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);