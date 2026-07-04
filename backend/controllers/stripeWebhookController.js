const AppError = require('../utils/appError');
const { getStripeClient, handleCheckoutSessionCompleted } = require('../models/stripeService');

async function handleStripeWebhook(req, res, next) {
    try {
        const signature = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new AppError('STRIPE_WEBHOOK_SECRET חסר בהגדרות השרת', 500);
        }

        if (!signature) {
            throw new AppError('חתימת Stripe חסרה בבקשה', 400);
        }

        const stripe = getStripeClient();
        const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

        if (event.type === 'checkout.session.completed') {
            await handleCheckoutSessionCompleted(event.data.object);
        }

        res.json({ received: true });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    handleStripeWebhook
};