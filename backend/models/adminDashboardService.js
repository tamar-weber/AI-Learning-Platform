const mongoose = require('mongoose');
const User = require('../middleware/User');
const Course = require('../middleware/Course');
const CoursePurchase = require('../middleware/CoursePurchase');
const Notification = require('../middleware/Notification');
const MessageCampaign = require('../middleware/MessageCampaign');
const AppError = require('../utils/appError');

const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL_MS = 60 * 1000;

function toObjectId(value) {
    return new mongoose.Types.ObjectId(value);
}

function normalizeDateRange({ from, to }) {
    const startDate = from ? new Date(from) : null;
    const endDate = to ? new Date(to) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
        throw new AppError('תאריך התחלה לא תקין', 400);
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
        throw new AppError('תאריך סיום לא תקין', 400);
    }

    return {
        startDate,
        endDate
    };
}

function buildDateFilter({ startDate, endDate }) {
    if (!startDate && !endDate) {
        return {};
    }

    const filter = {};

    if (startDate) {
        filter.$gte = startDate;
    }

    if (endDate) {
        filter.$lte = endDate;
    }

    return { createdAt: filter };
}

function buildPurchaseDateFilter({ startDate, endDate }) {
    if (!startDate && !endDate) {
        return {};
    }

    const filter = {};

    if (startDate) {
        filter.$gte = startDate;
    }

    if (endDate) {
        filter.$lte = endDate;
    }

    return { purchasedAt: filter };
}

async function getDashboardData({ rangeStart, rangeEnd } = {}) {
    const normalizedRange = normalizeDateRange({ from: rangeStart, to: rangeEnd });
    const cacheKey = JSON.stringify({
        rangeStart: normalizedRange.startDate ? normalizedRange.startDate.toISOString() : null,
        rangeEnd: normalizedRange.endDate ? normalizedRange.endDate.toISOString() : null
    });

    const cached = dashboardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.payload;
    }

    const userDateFilter = buildDateFilter(normalizedRange);
    const purchaseDateFilter = buildPurchaseDateFilter(normalizedRange);

    const [
        totalUsers,
        newUsers,
        totalCourses,
        activeCourses,
        totalEnrollments,
        totalRevenueResult,
        notificationsSent,
        messagesSent,
        latestRegistrations,
        latestPurchases,
        popularCourses,
        monthlyRevenue,
        yearlyRevenue
    ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'student', ...(Object.keys(userDateFilter).length ? userDateFilter : {}) }),
        Course.countDocuments(),
        Course.countDocuments({ enrollmentStatus: 'active' }),
        CoursePurchase.countDocuments({ ...(Object.keys(purchaseDateFilter).length ? purchaseDateFilter : {}) }),
        CoursePurchase.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    ...(Object.keys(purchaseDateFilter).length ? purchaseDateFilter : {})
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amountPaid' }
                }
            }
        ]),
        Notification.countDocuments({ ...(Object.keys(purchaseDateFilter).length ? { createdAt: purchaseDateFilter.createdAt } : {}) }),
        MessageCampaign.countDocuments({ ...(Object.keys(purchaseDateFilter).length ? { sentAt: purchaseDateFilter.purchasedAt } : {}) }),
        User.find({ role: 'student', ...(Object.keys(userDateFilter).length ? userDateFilter : {}) })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id name email createdAt'),
        CoursePurchase.find({ ...(Object.keys(purchaseDateFilter).length ? purchaseDateFilter : {}) })
            .sort({ purchasedAt: -1 })
            .limit(5)
            .populate('course', 'courseName coursePrice')
            .populate('user', 'name email'),
        CoursePurchase.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    ...(Object.keys(purchaseDateFilter).length ? purchaseDateFilter : {})
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $unwind: '$course'
            },
            {
                $group: {
                    _id: '$course._id',
                    courseName: { $first: '$course.courseName' },
                    enrollments: { $sum: 1 },
                    revenue: { $sum: '$amountPaid' }
                }
            },
            {
                $sort: { enrollments: -1, revenue: -1 }
            },
            {
                $limit: 5
            }
        ]),
        CoursePurchase.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    purchasedAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { month: { $month: '$purchasedAt' } },
                    revenue: { $sum: '$amountPaid' }
                }
            },
            {
                $sort: { '_id.month': 1 }
            }
        ]),
        CoursePurchase.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    purchasedAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { year: { $year: '$purchasedAt' } },
                    revenue: { $sum: '$amountPaid' }
                }
            },
            {
                $sort: { '_id.year': 1 }
            }
        ])
    ]);

    const payload = {
        kpis: {
            totalUsers,
            newUsers,
            totalCourses,
            enrollments: totalEnrollments,
            revenue: totalRevenueResult[0]?.totalRevenue || 0,
            activeCourses,
            notificationsSent,
            messagesSent
        },
        latestRegistrations: latestRegistrations.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        })),
        latestPurchases: latestPurchases.map((purchase) => ({
            id: purchase._id,
            userName: purchase.user?.name || 'לא זמין',
            courseName: purchase.course?.courseName || 'קורס לא זמין',
            price: purchase.amountPaid || purchase.course?.coursePrice || 0,
            date: purchase.purchasedAt,
            paymentMethod: purchase.paymentMethod || purchase.paymentProvider || 'unknown',
            transactionId: purchase.stripePaymentIntentId || purchase.stripeSessionId || '',
            status: purchase.paymentStatus,
            currency: purchase.currency || 'ILS'
        })),
        popularCourses: popularCourses.map((course) => ({
            id: course._id,
            courseName: course.courseName,
            enrollments: course.enrollments,
            revenue: course.revenue
        })),
        revenueStats: {
            monthly: monthlyRevenue.map((row) => ({
                month: row._id.month,
                revenue: row.revenue
            })),
            yearly: yearlyRevenue.map((row) => ({
                year: row._id.year,
                revenue: row.revenue
            }))
        },
        filters: {
            rangeStart: normalizedRange.startDate ? normalizedRange.startDate.toISOString() : null,
            rangeEnd: normalizedRange.endDate ? normalizedRange.endDate.toISOString() : null
        }
    };

    dashboardCache.set(cacheKey, {
        expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
        payload
    });

    return payload;
}

module.exports = {
    getDashboardData
};
