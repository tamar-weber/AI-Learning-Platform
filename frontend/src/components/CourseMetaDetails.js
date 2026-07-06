import React from 'react';

function formatDate(dateValue) {
    return dateValue ? new Date(dateValue).toLocaleDateString('he-IL') : '-';
}

function formatPrice(price) {
    return `₪${Number(price || 0).toLocaleString('he-IL')}`;
}

function formatEnrollmentStatus(status) {
    return status === 'active' ? 'פעיל' : 'לא פעיל';
}

function CourseMetaDetails({
    course,
    showDescription = false,
    showPurchasedAt = false,
    showCreatedAt = false
}) {
    return (
        <>
            <p><strong>מרצה:</strong> {course.lecturerName}</p>
            {showDescription && <p><strong>תיאור:</strong> {course.courseDescription || '-'}</p>}
            <p><strong>קטגוריה:</strong> {course.category || '-'}</p>
            <p><strong>מספר שיעורים:</strong> {course.lessonsCount ?? '-'}</p>
            <p><strong>תאריך פתיחת קורס:</strong> {formatDate(course.courseStartDate)}</p>
            <p><strong>סגירת הרשמה:</strong> {formatDate(course.enrollmentCloseDate)}</p>
            <p><strong>סטטוס הרשמה:</strong> {formatEnrollmentStatus(course.enrollmentStatus)}</p>
            <p><strong>מחיר:</strong> {formatPrice(course.coursePrice)}</p>
            {showPurchasedAt && <p><strong>נרכש בתאריך:</strong> {formatDate(course.purchasedAt)}</p>}
            {showCreatedAt && <p><strong>תאריך יצירה:</strong> {formatDate(course.createdAt)}</p>}
        </>
    );
}

export default CourseMetaDetails;
