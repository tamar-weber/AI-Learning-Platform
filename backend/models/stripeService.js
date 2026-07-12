const Stripe = require('stripe');
const mongoose = require('mongoose');
const Course = require('../middleware/Course');
const CoursePurchase = require('../middleware/CoursePurchase');
const User = require('../middleware/User');
const AppError = require('../utils/appError');
const { createNotification } = require('./notificationService');
const { sendEnrollmentConfirmationEmail } = require('./emailService');
const { logActivity } = require('./userActivityService');
const { config } = require('../config/env');

function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
        throw new AppError('STRIPE_SECRET_KEY חסר בהגדרות השרת', 500);
    }

    return new Stripe(secretKey);
}

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

async function createCheckoutSession({ userId, courseId, successUrl, cancelUrl }) {
    if (!isValidObjectId(userId) || !isValidObjectId(courseId)) {
        throw new AppError('מזהה משתמש או קורס לא תקין', 400);
    }

    const [user, course] = await Promise.all([
        User.findById(userId),
        Course.findById(courseId)
    ]);

    if (!user) {
        throw new AppError('המשתמש לא נמצא', 404);
    }

    if (!course) {
        throw new AppError('הקורס לא נמצא', 404);
    }

    if (course.enrollmentStatus !== 'active') {
        throw new AppError('לא ניתן לרכוש קורס שסגור להרשמה', 400);
    }

    const existingPurchase = await CoursePurchase.findOne({ user: userId, course: courseId });

    if (existingPurchase) {
        throw new AppError('הקורס כבר נרכש על ידי המשתמש', 400);
    }

    const stripe = getStripeClient();
    const amountInCents = Math.round(Number(course.coursePrice || 0) * 100);

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ['card'],
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'ils',
                    unit_amount: amountInCents,
                    product_data: {
                        name: course.courseName,
                        description: course.courseDescription || 'Course enrollment'
                    }
                }
            }
        ],
        metadata: {
            userId: String(user._id),
            courseId: String(course._id)
        }
    });

    return {
        checkoutUrl: session.url,
        sessionId: session.id
    };
}

async function handleCheckoutSessionCompleted(session) {
    const userId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;
    const sessionId = session.id;
    const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!userId || !courseId || !isValidObjectId(userId) || !isValidObjectId(courseId)) {
        throw new AppError('Webhook metadata לא תקין', 400);
    }

    const existingBySession = await CoursePurchase.findOne({ stripeSessionId: sessionId });

    if (existingBySession) {
        return { duplicate: true, reason: 'session_exists' };
    }

    if (paymentIntentId) {
        const existingByPaymentIntent = await CoursePurchase.findOne({ stripePaymentIntentId: paymentIntentId });
        if (existingByPaymentIntent) {
            return { duplicate: true, reason: 'payment_intent_exists' };
        }
    }

    const existingPurchase = await CoursePurchase.findOne({ user: userId, course: courseId });
    if (existingPurchase) {
        return { duplicate: true, reason: 'user_course_exists' };
    }

    const [course, user] = await Promise.all([
        Course.findById(courseId),
        User.findById(userId)
    ]);

    if (!course || !user) {
        throw new AppError('קורס או משתמש לא נמצאו בעת טיפול ב-webhook', 404);
    }

    const createdPurchase = await CoursePurchase.create({
        user: userId,
        course: courseId,
        paymentProvider: 'stripe',
        paymentStatus: 'paid',
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId || '',
        paymentMethod: 'card',
        amountPaid: Number(session.amount_total || 0) / 100,
        currency: String(session.currency || '').toUpperCase()
    });

    const currentEnrollment = Number(course.currentEnrollment) || 0;
    course.currentEnrollment = currentEnrollment + 1;
    await course.save();

    await createNotification({
        userId,
        title: 'התשלום בוצע בהצלחה',
        message: `התשלום עבור הקורס "${course.courseName}" אושר וההרשמה הושלמה.`,
        type: 'payment',
        courseId: course._id
    });

    await logActivity(userId, 'purchase', `בוצעה רכישה לקורס "${course.courseName}"`, course._id);
    await logActivity(userId, 'enrollment', `המשתמש נרשם לקורס "${course.courseName}"`, course._id);

    sendEnrollmentConfirmationEmail({
        to: user.email,
        userName: user.name,
        courseName: course.courseName,
        courseLink: `${config.frontendUrl}/my-courses`
    }).catch((error) => {
        console.error('Failed to send enrollment confirmation email:', error.message);
    });

    return {
        duplicate: false,
        purchaseId: createdPurchase._id
    };
}

module.exports = {
    getStripeClient,
    createCheckoutSession,
    handleCheckoutSessionCompleted
};