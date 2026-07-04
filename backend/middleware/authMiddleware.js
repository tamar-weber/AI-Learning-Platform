const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

function getTokenFromHeader(authHeader) {
    if (!authHeader || typeof authHeader !== 'string') {
        return null;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
}

function requireAuth(req, res, next) {
    try {
        const token = getTokenFromHeader(req.headers.authorization);

        if (!token) {
            throw new AppError('נדרש token להתחברות', 401);
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new AppError('JWT_SECRET חסר בהגדרות השרת', 500);
        }

        const payload = jwt.verify(token, secret);
        req.user = {
            _id: payload._id,
            email: payload.email,
            role: payload.role,
            name: payload.name
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new AppError('token לא תקין או פג תוקף', 401));
        }

        next(error);
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return next(new AppError('אין הרשאה לפעולה זו', 403));
        }

        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};