jest.mock('../middleware/User');
jest.mock('../models/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'fake', accepted: [], rejected: [] }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'fake', accepted: [], rejected: [] })
}));
jest.mock('../models/userActivityService', () => ({
    logActivity: jest.fn().mockResolvedValue(undefined)
}));

const bcrypt = require('bcrypt');
const User = require('../middleware/User');
const { registerUser, loginUser } = require('../models/authService');

beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jest-only';
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('registerUser', () => {
    it('rejects registration when password is missing', async () => {
        await expect(
            registerUser({ name: 'Tamar', idNumber: '123456789', phone: '0500000000', email: 'a@a.com' })
        ).rejects.toThrow(/חסרים שדות נדרשים/);
    });

    it('rejects passwords shorter than 8 characters', async () => {
        await expect(
            registerUser({
                name: 'Tamar',
                idNumber: '123456789',
                phone: '0500000000',
                email: 'a@a.com',
                password: '123'
            })
        ).rejects.toThrow(/לפחות 8 תווים/);
    });

    it('hashes the password before saving and never returns it', async () => {
        User.findOne = jest.fn().mockResolvedValue(null);

        const savedDoc = {
            _id: 'user1',
            name: 'Tamar',
            email: 'tamar@example.com',
            role: 'student',
            password: '',
            toObject() {
                return { _id: this._id, name: this.name, email: this.email, role: this.role, password: this.password };
            }
        };

        User.mockImplementation(function (data) {
            Object.assign(savedDoc, data);
            savedDoc.save = jest.fn().mockImplementation(async () => savedDoc);
            return savedDoc;
        });

        const result = await registerUser({
            name: 'Tamar',
            idNumber: '123456789',
            phone: '0500000000',
            email: 'tamar@example.com',
            password: 'SuperSecret123'
        });

        // Password must actually be hashed, never stored/returned in plaintext.
        expect(savedDoc.password).not.toBe('SuperSecret123');
        const isValidHash = await bcrypt.compare('SuperSecret123', savedDoc.password);
        expect(isValidHash).toBe(true);

        expect(result.password).toBeUndefined();
        expect(typeof result.token).toBe('string');
    });
});

describe('loginUser', () => {
    it('rejects login with wrong password without leaking which field was wrong', async () => {
        const hashed = await bcrypt.hash('correct-password', 10);
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: 'user1',
                email: 'tamar@example.com',
                password: hashed,
                role: 'student',
                toObject() {
                    return { _id: this._id, email: this.email, password: this.password, role: this.role };
                }
            })
        });

        await expect(
            loginUser({ email: 'tamar@example.com', password: 'wrong-password' })
        ).rejects.toThrow(/אימייל או סיסמה שגויים/);
    });

    it('returns a signed token on valid credentials', async () => {
        const hashed = await bcrypt.hash('correct-password', 10);
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: 'user1',
                email: 'tamar@example.com',
                password: hashed,
                role: 'student',
                toObject() {
                    return { _id: this._id, email: this.email, password: this.password, role: this.role };
                }
            })
        });

        const result = await loginUser({ email: 'tamar@example.com', password: 'correct-password' });

        expect(result.password).toBeUndefined();
        expect(typeof result.token).toBe('string');
    });
});
