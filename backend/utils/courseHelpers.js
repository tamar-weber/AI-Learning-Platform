const mongoose = require('mongoose');
const Course = require('../middleware/Course');

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Shared by courseService and myCoursesService - closes enrollment on courses
// whose enrollmentCloseDate has passed. Single source of truth so both call
// sites stay in sync if the rule ever changes.
async function syncExpiredCoursesStatus() {
    const today = startOfToday();

    await Course.updateMany(
        {
            enrollmentStatus: 'active',
            enrollmentCloseDate: { $lt: today }
        },
        {
            $set: { enrollmentStatus: 'inactive' }
        }
    );
}

module.exports = {
    isValidObjectId,
    startOfToday,
    syncExpiredCoursesStatus
};
