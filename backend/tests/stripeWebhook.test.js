jest.mock('../middleware/CoursePurchase');
jest.mock('../middleware/Course');
jest.mock('../middleware/User');
jest.mock('../models/notificationService', () => ({
    createNotification: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../models/emailService', () => ({
    sendEnrollmentConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'fake' })
}));
jest.mock('../models/userActivityService', () => ({
    logActivity: jest.fn().mockResolvedValue(undefined)
}));

const mongoose = require('mongoose');
const CoursePurchase = require('../middleware/CoursePurchase');
const Course = require('../middleware/Course');
const User = require('../middleware/User');
const { handleCheckoutSessionCompleted } = require('../models/stripeService');

const validUserId = new mongoose.Types.ObjectId().toString();
const validCourseId = new mongoose.Types.ObjectId().toString();

function fakeSession(overrides = {}) {
    return {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        amount_total: 5000,
        currency: 'ils',
        metadata: { userId: validUserId, courseId: validCourseId },
        ...overrides
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    Course.findById = jest.fn().mockResolvedValue({
        _id: validCourseId,
        courseName: 'React Basics',
        currentEnrollment: 3,
        save: jest.fn().mockResolvedValue(true)
    });
    User.findById = jest.fn().mockResolvedValue({ _id: validUserId, email: 'a@a.com', name: 'Tamar' });
    CoursePurchase.create = jest.fn().mockResolvedValue({ _id: 'purchase1' });
});

describe('handleCheckoutSessionCompleted', () => {
    it('rejects sessions with missing or invalid metadata', async () => {
        CoursePurchase.findOne = jest.fn().mockResolvedValue(null);

        await expect(
            handleCheckoutSessionCompleted(fakeSession({ metadata: {} }))
        ).rejects.toThrow(/metadata/i);
    });

    it('creates a purchase on first delivery of the event', async () => {
        CoursePurchase.findOne = jest.fn().mockResolvedValue(null);

        const result = await handleCheckoutSessionCompleted(fakeSession());

        expect(result.duplicate).toBe(false);
        expect(CoursePurchase.create).toHaveBeenCalledTimes(1);
    });

    it('does NOT create a duplicate purchase if the same session id is re-delivered (Stripe retries webhooks)', async () => {
        CoursePurchase.findOne = jest.fn().mockResolvedValue({ _id: 'already-exists' });

        const result = await handleCheckoutSessionCompleted(fakeSession());

        expect(result.duplicate).toBe(true);
        expect(CoursePurchase.create).not.toHaveBeenCalled();
    });

    it('does NOT create a duplicate purchase if the same payment_intent is re-delivered under a different session id', async () => {
        CoursePurchase.findOne = jest
            .fn()
            .mockResolvedValueOnce(null) // no match by stripeSessionId
            .mockResolvedValueOnce({ _id: 'already-exists' }); // match by paymentIntentId

        const result = await handleCheckoutSessionCompleted(fakeSession({ id: 'cs_test_different' }));

        expect(result.duplicate).toBe(true);
        expect(CoursePurchase.create).not.toHaveBeenCalled();
    });
});
