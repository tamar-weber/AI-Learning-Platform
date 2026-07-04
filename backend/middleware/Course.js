const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
    {
        courseName: {
            type: String,
            required: true,
            trim: true
        },
        lecturerName: {
            type: String,
            required: true,
            trim: true
        },
        courseDescription: {
            type: String,
            required: true,
            trim: true
        },
        lessonsCount: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        currentEnrollment: {
            type: Number,
            default: 0,
            min: 0
        },
        courseStartDate: {
            type: Date,
            required: true
        },
        enrollmentCloseDate: {
            type: Date,
            required: true
        },
        coursePrice: {
            type: Number,
            required: true,
            min: 0
        },
        enrollmentStatus: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    { timestamps: true }
);

CourseSchema.index({ createdAt: -1 });
CourseSchema.index({ courseName: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ enrollmentStatus: 1 });

module.exports = mongoose.model('Course', CourseSchema);
