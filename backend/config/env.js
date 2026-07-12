// Single source of truth for environment configuration.
// Every other file should import from here instead of reading process.env
// directly - this is what prevents the FRONTEND_URL / FRONTEND_BASE_URL /
// CLIENT_URL naming drift that existed before.

require('dotenv').config();

const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];

const config = {
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || 'development',

    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,

    openaiApiKey: process.env.OPENAI_API_KEY,

    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,

    // Single canonical name for "where the frontend lives".
    // Kept backward-compatible: falls back to the older env var names in
    // case they're still set in someone's local .env, but FRONTEND_URL is
    // the one to use going forward (see .env.example).
    frontendUrl:
        process.env.FRONTEND_URL ||
        process.env.FRONTEND_BASE_URL ||
        process.env.CLIENT_URL ||
        'http://localhost:3000'
};

function assertProductionConfig() {
    if (config.nodeEnv !== 'production') {
        return;
    }

    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }
}

module.exports = { config, assertProductionConfig };
