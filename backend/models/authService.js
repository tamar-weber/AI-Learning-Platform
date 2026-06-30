const User = require('../middleware/User');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

function validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
        throw new AppError(`חסרים שדות נדרשים: ${missingFields.join(', ')}`);
    }
}

async function registerUser(userData) {
    const { name, idNumber, phone, email } = userData;
    const password = typeof userData.password === 'string' ? userData.password.trim() : '';

    validateRequiredFields({ name, idNumber, phone, email, password }, ['name', 'idNumber', 'phone', 'email', 'password']);

    if (password.length < 8) {
        throw new AppError('הסיסמה חייבת להכיל לפחות 8 תווים');
    }

    const existingUser = await User.findOne({
        $or: [{ idNumber }, { email }]
    });

    if (existingUser) {
        throw new AppError('משתמש עם תעודת זהות או אימייל זה כבר רשום');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ name, idNumber, phone, email });
    newUser.password = hashedPassword;
    await newUser.save();

    console.log('DEBUG saved user fields:', Object.keys(newUser.toObject()));

    const userObject = newUser.toObject();
    delete userObject.password;

    return userObject;
}

async function loginUser(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
        throw new AppError('נא למלא אימייל וסיסמה');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        throw new AppError('אימייל או סיסמה שגויים');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new AppError('אימייל או סיסמה שגויים');
    }

    const userObject = user.toObject();
    delete userObject.password;

    return userObject;
}

module.exports = {
    registerUser,
    loginUser
};
