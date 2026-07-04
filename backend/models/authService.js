const User = require('../middleware/User');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./emailService');
const { logActivity } = require('./userActivityService');

const SALT_ROUNDS = 10;
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000;
const RESET_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RESET_LIMIT_MAX_REQUESTS = 3;
const GENERIC_RESET_RESPONSE = {
    message: 'אם האימייל קיים במערכת, נשלח קישור לאיפוס סיסמה.'
};

function buildAuthPayload(userObject) {
    return {
        _id: userObject._id,
        name: userObject.name,
        email: userObject.email,
        role: userObject.role
    };
}

function generateToken(userObject) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError('JWT_SECRET חסר בהגדרות השרת', 500);
    }

    return jwt.sign(buildAuthPayload(userObject), secret, {
        expiresIn: '7d'
    });
}

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

    sendWelcomeEmail({ to: newUser.email, name: newUser.name })
        .then((info) => {
            console.log('Welcome email sent:', {
                to: newUser.email,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected
            });
        })
        .catch((error) => {
            console.error('Failed to send welcome email:', error.message);
        });

    console.log('DEBUG saved user fields:', Object.keys(newUser.toObject()));

    const userObject = newUser.toObject();
    delete userObject.password;

    userObject.token = generateToken(userObject);

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

    await logActivity(user._id, 'login', 'המשתמש התחבר למערכת');

    userObject.token = generateToken(userObject);

    return userObject;
}

function hashResetToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function buildResetLink(rawToken) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

function applyResetRateLimit(user) {
    const now = Date.now();
    const requestedAt = user.passwordResetRequestedAt ? user.passwordResetRequestedAt.getTime() : 0;
    const withinWindow = requestedAt && now - requestedAt < RESET_LIMIT_WINDOW_MS;

    if (!withinWindow) {
        user.passwordResetRequestedAt = new Date(now);
        user.passwordResetRequestCount = 1;
        return;
    }

    if ((user.passwordResetRequestCount || 0) >= RESET_LIMIT_MAX_REQUESTS) {
        throw new AppError('בוצעו יותר מדי בקשות איפוס. נסה שוב בעוד שעה.', 429);
    }

    user.passwordResetRequestCount += 1;
}

async function requestPasswordReset(email) {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
        throw new AppError('נא למלא כתובת אימייל');
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
        '+passwordResetTokenHash +passwordResetExpiresAt +passwordResetRequestedAt +passwordResetRequestCount'
    );

    if (!user) {
        return GENERIC_RESET_RESPONSE;
    }

    applyResetRateLimit(user);

    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);
    await user.save();

    const resetLink = buildResetLink(rawToken);

    sendPasswordResetEmail({ to: user.email, resetLink })
        .then((info) => {
            console.log('Password reset email sent:', {
                to: user.email,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected
            });
        })
        .catch((error) => {
            console.error('Failed to send password reset email:', error.message);
        });

    return GENERIC_RESET_RESPONSE;
}

async function resetPassword({ token, password, confirmPassword }) {
    const normalizedToken = typeof token === 'string' ? token.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';
    const normalizedConfirmPassword = typeof confirmPassword === 'string' ? confirmPassword.trim() : '';

    validateRequiredFields(
        {
            token: normalizedToken,
            password: normalizedPassword,
            confirmPassword: normalizedConfirmPassword
        },
        ['token', 'password', 'confirmPassword']
    );

    if (normalizedPassword.length < 8) {
        throw new AppError('הסיסמה חייבת להכיל לפחות 8 תווים');
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
        throw new AppError('הסיסמאות אינן תואמות');
    }

    const tokenHash = hashResetToken(normalizedToken);

    const user = await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() }
    }).select('+password +passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) {
        throw new AppError('קישור איפוס לא תקין או שפג תוקפו', 400);
    }

    user.password = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    await logActivity(user._id, 'password_change', 'המשתמש שינה סיסמה בהצלחה');

    return { message: 'הסיסמה אופסה בהצלחה' };
}

async function updateProfile({ authUserId, name, phone, email }) {
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    validateRequiredFields(
        {
            authUserId,
            name: normalizedName,
            phone: normalizedPhone,
            email: normalizedEmail
        },
        ['authUserId', 'name', 'phone', 'email']
    );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        throw new AppError('כתובת אימייל לא תקינה', 400);
    }

    const user = await User.findById(authUserId).select('+password');

    if (!user) {
        throw new AppError('המשתמש לא נמצא', 404);
    }

    const existingUserWithEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserWithEmail && String(existingUserWithEmail._id) !== String(user._id)) {
        throw new AppError('האימייל כבר בשימוש במערכת', 400);
    }

    user.name = normalizedName;
    user.phone = normalizedPhone;
    user.email = normalizedEmail;
    await user.save();

    await logActivity(user._id, 'profile_update', 'פרופיל המשתמש עודכן');

    const userObject = user.toObject();
    delete userObject.password;

    return {
        user: userObject,
        token: generateToken(userObject)
    };
}

module.exports = {
    registerUser,
    loginUser,
    requestPasswordReset,
    resetPassword,
    updateProfile
};
