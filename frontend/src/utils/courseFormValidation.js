function parseNumber(value) {
    return Number(value);
}

function parseDate(value) {
    return new Date(value);
}

export function validateCourseForm(formData) {
    const normalizedLessonsCount = parseNumber(formData.lessonsCount);
    const normalizedPrice = parseNumber(formData.coursePrice);
    const normalizedStartDate = parseDate(formData.courseStartDate);
    const normalizedCloseDate = parseDate(formData.enrollmentCloseDate);

    if (
        !formData.courseName.trim()
        || !formData.lecturerName.trim()
        || !formData.courseDescription.trim()
        || !formData.category.trim()
    ) {
        return { error: 'יש למלא שם קורס, שם מרצה, תיאור וקטגוריה.' };
    }

    if (
        Number.isNaN(normalizedLessonsCount)
        || Number.isNaN(normalizedPrice)
        || normalizedLessonsCount < 0
        || normalizedPrice < 0
    ) {
        return { error: 'מספר שיעורים ומחיר קורס חייבים להיות 0 ומעלה.' };
    }

    if (!Number.isInteger(normalizedLessonsCount)) {
        return { error: 'מספר שיעורים חייב להיות מספר שלם.' };
    }

    if (Number.isNaN(normalizedStartDate.getTime()) || Number.isNaN(normalizedCloseDate.getTime())) {
        return { error: 'יש לבחור תאריך פתיחת קורס ותאריך סגירת הרשמה.' };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (normalizedStartDate < todayStart) {
        return { error: 'לא ניתן להוסיף או לעדכן קורס עם תאריך פתיחה שכבר עבר.' };
    }

    if (normalizedCloseDate < todayStart) {
        return { error: 'לא ניתן להוסיף או לעדכן קורס עם תאריך סגירת הרשמה שכבר עבר.' };
    }

    if (normalizedCloseDate >= normalizedStartDate) {
        return { error: 'תאריך סגירת הרשמה חייב להיות לפני תאריך פתיחת הקורס.' };
    }

    return {
        payload: {
            courseName: formData.courseName.trim(),
            lecturerName: formData.lecturerName.trim(),
            courseDescription: formData.courseDescription.trim(),
            lessonsCount: normalizedLessonsCount,
            category: formData.category.trim(),
            courseStartDate: formData.courseStartDate,
            enrollmentCloseDate: formData.enrollmentCloseDate,
            coursePrice: normalizedPrice,
            enrollmentStatus: formData.enrollmentStatus
        }
    };
}
