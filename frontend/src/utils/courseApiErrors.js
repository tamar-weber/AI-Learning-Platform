export function getCoursesLoadErrorMessage(error, fallback = 'לא ניתן היה לטעון את רשימת הקורסים.') {
    return error.response?.data?.error || fallback;
}

export function getCourseSaveErrorMessage(error) {
    if (error.response?.status === 404) {
        return 'נתיב הקורסים לא נמצא בשרת (404). יש לאתחל את שרת ה-backend ולהפעיל שוב.';
    }

    return error.response?.data?.error || 'לא ניתן היה לשמור את הקורס.';
}

export function getCourseDeleteErrorMessage(error) {
    return error.response?.data?.error || 'לא ניתן היה למחוק את הקורס.';
}

export function getCoursePurchaseErrorMessage(error) {
    return error.response?.data?.error || 'לא ניתן היה לרכוש את הקורס.';
}
