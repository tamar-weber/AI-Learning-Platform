const User = require('../models/User');
const AppError = require('../utils/appError');

function validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
        throw new AppError(`חסרים שדות נדרשים: ${missingFields.join(', ')}`);
    }
}

async function registerUser(userData) {
    const { name, idNumber, phone, email } = userData;

    validateRequiredFields({ name, idNumber, phone, email }, ['name', 'idNumber', 'phone', 'email']);

    const existingUser = await User.findOne({
        $or: [{ idNumber }, { email }]
    });

    if (existingUser) {
        throw new AppError('משתמש עם תעודת זהות או אימייל זה כבר רשום');
    }

    const newUser = new User({ name, idNumber, phone, email });
    await newUser.save();

    return newUser;
}

async function loginUser(credentials) {
    const { idNumber, email } = credentials;

    if (!idNumber && !email) {
        throw new AppError('נא למלא אימייל או תעודת זהות');
    }

    const user = await User.findOne({
        $or: [{ idNumber }, { email }]
    });

    if (!user) {
        throw new AppError('משתמש לא נמצא במערכת');
    }

    return user;
}

module.exports = {
    registerUser,
    loginUser
};
