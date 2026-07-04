const mongoose = require('mongoose');
const Course = require('../middleware/Course');
const AppError = require('../utils/appError');

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

function normalizeStatus(value) {
    if (!value) {
        return undefined;
    }

    const normalizedValue = String(value).trim().toLowerCase();

    if (normalizedValue === 'active' || normalizedValue === 'פעיל') {
        return 'active';
    }

    if (normalizedValue === 'inactive' || normalizedValue === 'לא פעיל') {
        return 'inactive';
    }

    throw new AppError('סטטוס הרשמה לא תקין. יש להשתמש ב-active/inactive או פעיל/לא פעיל', 400);
}

function buildMissingFieldsUpdate(course) {
    const updates = {};
    const fallbackDate = course.createdAt || new Date();

    if (course.courseDescription === undefined || course.courseDescription === null || course.courseDescription === '') {
        updates.courseDescription = 'טרם עודכן תיאור';
    }

    if (course.lessonsCount === undefined || course.lessonsCount === null) {
        updates.lessonsCount = 0;
    }

    if (course.category === undefined || course.category === null || course.category === '') {
        updates.category = 'לא סווג';
    }

    if (course.currentEnrollment === undefined || course.currentEnrollment === null) {
        updates.currentEnrollment = 0;
    }

    if (!course.courseStartDate) {
        updates.courseStartDate = fallbackDate;
    }

    if (!course.enrollmentCloseDate) {
        updates.enrollmentCloseDate = fallbackDate;
    }

    return updates;
}

async function backfillCourseIfNeeded(course) {
    const updates = buildMissingFieldsUpdate(course);

    if (Object.keys(updates).length === 0) {
        return course;
    }

    await Course.updateOne({ _id: course._id }, { $set: updates });
    return { ...course.toObject(), ...updates };
}

function toCourseResponse(course) {
    return {
        id: course._id,
        courseName: course.courseName,
        lecturerName: course.lecturerName,
        courseDescription: course.courseDescription,
        lessonsCount: course.lessonsCount,
        category: course.category,
        currentEnrollment: course.currentEnrollment,
        courseStartDate: course.courseStartDate,
        enrollmentCloseDate: course.enrollmentCloseDate,
        coursePrice: course.coursePrice,
        enrollmentStatus: course.enrollmentStatus,
        createdAt: course.createdAt
    };
}

function normalizeSearchValue(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

function resolveSearchField(searchBy) {
    const normalized = normalizeSearchValue(searchBy).toLowerCase();

    if (normalized === 'coursename' || normalized === 'course') {
        return 'courseName';
    }

    if (normalized === 'category') {
        return 'category';
    }

    if (normalized === 'lecturername' || normalized === 'lecturer' || normalized === 'instructor') {
        return 'lecturerName';
    }

    return '';
}

function normalizeBoolean(value) {
    if (value === true || value === 'true' || value === '1' || value === 1) {
        return true;
    }

    return false;
}

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getAutoEnrollmentStatus(courseStartDate, enrollmentCloseDate) {
    if (!enrollmentCloseDate || Number.isNaN(new Date(enrollmentCloseDate).getTime())) {
        return undefined;
    }

    const today = startOfToday();
    const closeDate = new Date(enrollmentCloseDate);

    if (closeDate < today) {
        return 'inactive';
    }

    if (!courseStartDate || Number.isNaN(new Date(courseStartDate).getTime())) {
        return undefined;
    }

    return undefined;
}

function validateCourseDates(courseStartDate, enrollmentCloseDate) {
    if (Number.isNaN(courseStartDate.getTime()) || Number.isNaN(enrollmentCloseDate.getTime())) {
        throw new AppError('תאריך פתיחת קורס או תאריך סגירת הרשמה לא תקין', 400);
    }

    const today = startOfToday();

    if (courseStartDate < today) {
        throw new AppError('לא ניתן להוסיף או לעדכן קורס עם תאריך פתיחה שכבר עבר', 400);
    }

    if (enrollmentCloseDate < today) {
        throw new AppError('לא ניתן להוסיף או לעדכן קורס עם תאריך סגירת הרשמה שכבר עבר', 400);
    }

    if (enrollmentCloseDate >= courseStartDate) {
        throw new AppError('תאריך סגירת הרשמה חייב להיות לפני תאריך פתיחת הקורס', 400);
    }
}

async function syncExpiredCoursesStatus() {
    const today = startOfToday();

    await Course.updateMany(
        {
            enrollmentStatus: 'active',
            enrollmentCloseDate: { $lt: today }
        },
        {
            $set: { enrollmentStatus: 'inactive' }
        }
    );
}

async function createCourse(courseData) {
    const courseName = typeof courseData.courseName === 'string' ? courseData.courseName.trim() : '';
    const lecturerName = typeof courseData.lecturerName === 'string' ? courseData.lecturerName.trim() : '';
    const courseDescription = typeof courseData.courseDescription === 'string' ? courseData.courseDescription.trim() : '';
    const lessonsCount = Number(courseData.lessonsCount);
    const category = typeof courseData.category === 'string' ? courseData.category.trim() : '';
    const currentEnrollment = courseData.currentEnrollment === undefined
        ? 0
        : Number(courseData.currentEnrollment);
    const courseStartDate = new Date(courseData.courseStartDate);
    const enrollmentCloseDate = new Date(courseData.enrollmentCloseDate);
    const coursePrice = Number(courseData.coursePrice);
    const enrollmentStatus = normalizeStatus(courseData.enrollmentStatus) || 'active';

    if (
        !courseName
        || !lecturerName
        || !courseDescription
        || Number.isNaN(lessonsCount)
        || !category
        || Number.isNaN(coursePrice)
        || Number.isNaN(courseStartDate.getTime())
        || Number.isNaN(enrollmentCloseDate.getTime())
    ) {
        throw new AppError(
            'חסרים שדות נדרשים: courseName, lecturerName, courseDescription, lessonsCount, category, courseStartDate, enrollmentCloseDate, coursePrice',
            400
        );
    }

    if (coursePrice < 0 || lessonsCount < 0 || Number.isNaN(currentEnrollment) || currentEnrollment < 0) {
        throw new AppError('מחיר הקורס, מספר שיעורים ומספר נרשמים נוכחי חייבים להיות 0 ומעלה', 400);
    }

    if (!Number.isInteger(lessonsCount) || !Number.isInteger(currentEnrollment)) {
        throw new AppError('מספר שיעורים ומספר נרשמים נוכחי חייבים להיות מספרים שלמים', 400);
    }

    validateCourseDates(courseStartDate, enrollmentCloseDate);

    const computedStatus = getAutoEnrollmentStatus(courseStartDate, enrollmentCloseDate) || enrollmentStatus;

    const course = await Course.create({
        courseName,
        lecturerName,
        courseDescription,
        lessonsCount,
        category,
        currentEnrollment,
        courseStartDate,
        enrollmentCloseDate,
        coursePrice,
        enrollmentStatus: computedStatus
    });

    return toCourseResponse(course);
}

async function getAllCourses(query = {}) {
    await syncExpiredCoursesStatus();

    const search = normalizeSearchValue(query.search);
    const category = normalizeSearchValue(query.category);
    const searchField = resolveSearchField(query.searchBy);
    const onlyActive = normalizeBoolean(query.onlyActive);
    const normalizedPage = Number(query.page) > 0 ? Number(query.page) : 1;
    const normalizedLimit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 50) : 0;
    const mongoQuery = {};

    if (onlyActive) {
        mongoQuery.enrollmentStatus = 'active';
    }

    if (search) {
        if (searchField) {
            mongoQuery[searchField] = { $regex: search, $options: 'i' };
        } else {
            mongoQuery.$or = [
                { courseName: { $regex: search, $options: 'i' } },
                { lecturerName: { $regex: search, $options: 'i' } },
                { courseDescription: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }
    }

    if (category) {
        mongoQuery.category = { $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
    }

    const baseQuery = Course.find(mongoQuery).sort({ createdAt: -1 });

    if (!normalizedLimit) {
        const courses = await baseQuery;
        const normalizedCourses = await Promise.all(courses.map((course) => backfillCourseIfNeeded(course)));

        return {
            items: normalizedCourses.map(toCourseResponse),
            pagination: {
                page: 1,
                limit: 0,
                total: normalizedCourses.length,
                totalPages: 1
            }
        };
    }

    const skip = (normalizedPage - 1) * normalizedLimit;

    const [courses, total] = await Promise.all([
        baseQuery.skip(skip).limit(normalizedLimit),
        Course.countDocuments(mongoQuery)
    ]);

    const normalizedCourses = await Promise.all(courses.map((course) => backfillCourseIfNeeded(course)));

    return {
        items: normalizedCourses.map(toCourseResponse),
        pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total,
            totalPages: Math.max(Math.ceil(total / normalizedLimit), 1)
        }
    };
}

async function getCourseById(courseId) {
    if (!isValidObjectId(courseId)) {
        throw new AppError('מזהה קורס לא תקין', 400);
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new AppError('הקורס לא נמצא', 404);
    }

    const normalizedCourse = await backfillCourseIfNeeded(course);

    return toCourseResponse(normalizedCourse);
}

async function updateCourse(courseId, updates) {
    if (!isValidObjectId(courseId)) {
        throw new AppError('מזהה קורס לא תקין', 400);
    }

    const updatePayload = {};

    if (typeof updates.courseName === 'string') {
        updatePayload.courseName = updates.courseName.trim();
    }

    if (typeof updates.lecturerName === 'string') {
        updatePayload.lecturerName = updates.lecturerName.trim();
    }

    if (typeof updates.courseDescription === 'string') {
        updatePayload.courseDescription = updates.courseDescription.trim();
    }

    if (typeof updates.category === 'string') {
        updatePayload.category = updates.category.trim();
    }

    if (updates.lessonsCount !== undefined) {
        const normalizedLessonsCount = Number(updates.lessonsCount);

        if (Number.isNaN(normalizedLessonsCount) || normalizedLessonsCount < 0 || !Number.isInteger(normalizedLessonsCount)) {
            throw new AppError('מספר שיעורים חייב להיות מספר שלם 0 ומעלה', 400);
        }

        updatePayload.lessonsCount = normalizedLessonsCount;
    }

    if (updates.currentEnrollment !== undefined) {
        const normalizedCurrentEnrollment = Number(updates.currentEnrollment);

        if (Number.isNaN(normalizedCurrentEnrollment) || normalizedCurrentEnrollment < 0 || !Number.isInteger(normalizedCurrentEnrollment)) {
            throw new AppError('מספר נרשמים נוכחי חייב להיות מספר שלם 0 ומעלה', 400);
        }

        updatePayload.currentEnrollment = normalizedCurrentEnrollment;
    }

    let effectiveStartDateForValidation;
    let effectiveCloseDateForValidation;

    if (updates.courseStartDate !== undefined) {
        const normalizedStartDate = new Date(updates.courseStartDate);

        if (Number.isNaN(normalizedStartDate.getTime())) {
            throw new AppError('תאריך פתיחת קורס לא תקין', 400);
        }

        updatePayload.courseStartDate = normalizedStartDate;
    }

    if (updates.enrollmentCloseDate !== undefined) {
        const normalizedCloseDate = new Date(updates.enrollmentCloseDate);

        if (Number.isNaN(normalizedCloseDate.getTime())) {
            throw new AppError('תאריך סגירת הרשמה לא תקין', 400);
        }

        updatePayload.enrollmentCloseDate = normalizedCloseDate;
    }

    if (updates.coursePrice !== undefined) {
        const normalizedPrice = Number(updates.coursePrice);

        if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
            throw new AppError('מחיר קורס לא תקין', 400);
        }

        updatePayload.coursePrice = normalizedPrice;
    }

    if (updates.enrollmentStatus !== undefined) {
        updatePayload.enrollmentStatus = normalizeStatus(updates.enrollmentStatus);
    }

    const existingCourse = await Course.findById(courseId);

    if (!existingCourse) {
        throw new AppError('הקורס לא נמצא', 404);
    }

    effectiveStartDateForValidation = updatePayload.courseStartDate || existingCourse.courseStartDate;
    effectiveCloseDateForValidation = updatePayload.enrollmentCloseDate || existingCourse.enrollmentCloseDate;

    validateCourseDates(new Date(effectiveStartDateForValidation), new Date(effectiveCloseDateForValidation));

    const autoStatus = getAutoEnrollmentStatus(effectiveStartDateForValidation, effectiveCloseDateForValidation);

    if (autoStatus) {
        updatePayload.enrollmentStatus = autoStatus;
    }

    const course = await Course.findByIdAndUpdate(courseId, updatePayload, {
        new: true,
        runValidators: true
    });

    return toCourseResponse(course);
}

async function deleteCourse(courseId) {
    if (!isValidObjectId(courseId)) {
        throw new AppError('מזהה קורס לא תקין', 400);
    }

    const deletionResult = await Course.deleteOne({ _id: courseId });

    if (deletionResult.deletedCount === 0) {
        throw new AppError('הקורס לא נמצא', 404);
    }

    return { message: 'הקורס נמחק בהצלחה' };
}

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};
