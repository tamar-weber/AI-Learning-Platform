const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.' }
});

module.exports = { authLimiter };
