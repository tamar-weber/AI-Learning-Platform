export const COURSE_SEARCH_OPTIONS = [
    { value: 'courseName', label: 'חיפוש לפי שם קורס' },
    { value: 'category', label: 'חיפוש לפי קטגוריה' },
    { value: 'lecturerName', label: 'חיפוש לפי מרצה' }
];

export function getCourseSearchPlaceholder(searchBy) {
    if (searchBy === 'courseName') {
        return 'הקלד שם קורס';
    }

    if (searchBy === 'category') {
        return 'הקלד קטגוריה';
    }

    return 'הקלד שם מרצה';
}
