const mongoose = require('mongoose');
const User = require('../middleware/User');
const Prompt = require('../middleware/Prompt');
const AppError = require('../utils/appError');

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

async function getAllUsers() {
    return User.find({ role: 'student' })
        .select('-__v')
        .sort({ createdAt: -1 });
}

async function deleteUser(userId) {
    if (!isValidObjectId(userId)) {
        throw new AppError('מזהה משתמש לא תקין', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('המשתמש לא נמצא', 404);
    }

    if (user.role !== 'student') {
        throw new AppError('ניתן למחוק רק תלמידים', 400);
    }

    await User.deleteOne({ _id: userId });

    return { message: 'המשתמש נמחק בהצלחה' };
}

async function getUserById(userId) {
    if (!isValidObjectId(userId)) {
        throw new AppError('מזהה משתמש לא תקין', 400);
    }

    const user = await User.findById(userId).select('-__v');

    if (!user) {
        throw new AppError('המשתמש לא נמצא', 404);
    }

    return user;
}

async function getAllPrompts() {
    const prompts = await Prompt.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .select('-__v');

    return prompts.map((prompt) => ({
        id: prompt._id,
        userName: prompt.user?.name || 'משתמש לא ידוע',
        categoryName: prompt.category || 'כללי',
        subCategoryName: prompt.subCategory || '',
        prompt: prompt.prompt,
        response: prompt.response
    }));
}

module.exports = {
    getAllUsers,
    getUserById,
    getAllPrompts,
    deleteUser
};
