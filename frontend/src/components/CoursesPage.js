import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import '../styles/coursesPage.css';

const STATUS_OPTIONS = [
    { value: 'active', label: 'פעיל' },
    { value: 'inactive', label: 'לא פעיל' }
];

const INITIAL_FORM = {
    courseName: '',
    lecturerName: '',
    courseDescription: '',
    lessonsCount: '',
    category: '',
    currentEnrollment: '',
    courseStartDate: '',
    enrollmentCloseDate: '',
    coursePrice: '',
    enrollmentStatus: 'active'
};

function normalizeDateForInput(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [editingCourseId, setEditingCourseId] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const submitLabel = useMemo(() => (
        editingCourseId ? 'שמירת שינויים' : 'יצירת קורס'
    ), [editingCourseId]);

    const loadCourses = async () => {
        try {
            setError('');
            const response = await api.get('/courses');
            setCourses(response.data);
        } catch (err) {
            console.error('שגיאה בטעינת קורסים:', err);
            setError('לא ניתן היה לטעון את רשימת הקורסים.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setEditingCourseId('');
        setIsFormVisible(false);
    };

    const validateForm = () => {
        const normalizedLessonsCount = Number(formData.lessonsCount);
        const normalizedCurrentEnrollment = Number(formData.currentEnrollment);
        const normalizedPrice = Number(formData.coursePrice);
        const normalizedStartDate = new Date(formData.courseStartDate);
        const normalizedCloseDate = new Date(formData.enrollmentCloseDate);

        if (
            !formData.courseName.trim()
            || !formData.lecturerName.trim()
            || !formData.courseDescription.trim()
            || !formData.category.trim()
        ) {
            setError('יש למלא שם קורס, שם מרצה, תיאור וקטגוריה.');
            return null;
        }

        if (
            Number.isNaN(normalizedLessonsCount)
            || Number.isNaN(normalizedCurrentEnrollment)
            || Number.isNaN(normalizedPrice)
            || normalizedLessonsCount < 0
            || normalizedCurrentEnrollment < 0
            || normalizedPrice < 0
        ) {
            setError('מספר שיעורים, מספר נרשמים ומחיר קורס חייבים להיות 0 ומעלה.');
            return null;
        }

        if (!Number.isInteger(normalizedLessonsCount) || !Number.isInteger(normalizedCurrentEnrollment)) {
            setError('מספר שיעורים ומספר נרשמים חייבים להיות מספרים שלמים.');
            return null;
        }

        if (Number.isNaN(normalizedStartDate.getTime()) || Number.isNaN(normalizedCloseDate.getTime())) {
            setError('יש לבחור תאריך פתיחת קורס ותאריך סגירת הרשמה.');
            return null;
        }

        if (normalizedCloseDate < normalizedStartDate) {
            setError('סגירת הרשמה לא יכולה להיות לפני תאריך פתיחת הקורס.');
            return null;
        }

        return {
            courseName: formData.courseName.trim(),
            lecturerName: formData.lecturerName.trim(),
            courseDescription: formData.courseDescription.trim(),
            lessonsCount: normalizedLessonsCount,
            category: formData.category.trim(),
            currentEnrollment: normalizedCurrentEnrollment,
            courseStartDate: formData.courseStartDate,
            enrollmentCloseDate: formData.enrollmentCloseDate,
            coursePrice: normalizedPrice,
            enrollmentStatus: formData.enrollmentStatus
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = validateForm();

        if (!payload) {
            return;
        }

        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            if (editingCourseId) {
                const updateResponse = await api.patch(`/courses/${editingCourseId}`, payload);
                console.log('✅ הקורס עודכן בהצלחה:', updateResponse.data);
                setSuccessMessage(`הקורס "${updateResponse.data.courseName}" עודכן בהצלחה.`);
            } else {
                const createResponse = await api.post('/courses', payload);
                console.log('✅ הקורס נוצר בהצלחה:', createResponse.data);
                setSuccessMessage(`הקורס "${createResponse.data.courseName}" נוסף בהצלחה.`);
            }

            resetForm();
            await loadCourses();
        } catch (err) {
            console.error('שגיאה בשמירת קורס:', err);
            if (err.response?.status === 404) {
                setError('נתיב הקורסים לא נמצא בשרת (404). יש לאתחל את שרת ה-backend ולהפעיל שוב.');
            } else {
                setError(err.response?.data?.error || 'לא ניתן היה לשמור את הקורס.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (course) => {
        setError('');
        setSuccessMessage('');
        setEditingCourseId(course.id);
        setIsFormVisible(true);
        setFormData({
            courseName: course.courseName,
            lecturerName: course.lecturerName,
            courseDescription: course.courseDescription || '',
            lessonsCount: String(course.lessonsCount ?? ''),
            category: course.category || '',
            currentEnrollment: String(course.currentEnrollment ?? ''),
            courseStartDate: normalizeDateForInput(course.courseStartDate),
            enrollmentCloseDate: normalizeDateForInput(course.enrollmentCloseDate),
            coursePrice: String(course.coursePrice),
            enrollmentStatus: course.enrollmentStatus
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenCreateForm = () => {
        setError('');
        setSuccessMessage('');
        setEditingCourseId('');
        setFormData(INITIAL_FORM);
        setIsFormVisible(true);
    };

    const handleDelete = async (course) => {
        const confirmDelete = window.confirm(`למחוק את הקורס "${course.courseName}"?`);

        if (!confirmDelete) {
            return;
        }

        try {
            setError('');
            setSuccessMessage('');
            await api.delete(`/courses/${course.id}`);

            if (editingCourseId === course.id) {
                resetForm();
            }

            setCourses((prev) => prev.filter((item) => item.id !== course.id));
            setSuccessMessage('הקורס נמחק בהצלחה.');
        } catch (err) {
            console.error('שגיאה במחיקת קורס:', err);
            setError(err.response?.data?.error || 'לא ניתן היה למחוק את הקורס.');
        }
    };

    return (
        <div className="courses-page">
            <header className="courses-header">
                <h1 className="courses-title">ניהול קורסים</h1>
                <button type="button" className="courses-primary-button" onClick={handleOpenCreateForm}>
                    הוספת קורס חדש
                </button>
            </header>

            {error && <p className="courses-message courses-error">{error}</p>}
            {successMessage && <p className="courses-message courses-success">{successMessage}</p>}

            <section className="courses-list-wrapper">
                <h2 className="courses-list-title">רשימת קורסים</h2>

                {isLoading ? (
                    <p className="courses-empty">טוען קורסים...</p>
                ) : courses.length === 0 ? (
                    <p className="courses-empty">עדיין לא נוצרו קורסים.</p>
                ) : (
                    <div className="courses-list">
                        {courses.map((course) => (
                            <article key={course.id} className="courses-card">
                                <h3 className="courses-card-title">{course.courseName}</h3>
                                <p><strong>מרצה:</strong> {course.lecturerName}</p>
                                <p><strong>תיאור:</strong> {course.courseDescription || '-'}</p>
                                <p><strong>מספר שיעורים:</strong> {course.lessonsCount ?? '-'}</p>
                                <p><strong>קטגוריה:</strong> {course.category || '-'}</p>
                                <p><strong>מספר נרשמים נוכחי:</strong> {course.currentEnrollment ?? '-'}</p>
                                <p><strong>תאריך פתיחת הקורס:</strong> {course.courseStartDate ? new Date(course.courseStartDate).toLocaleDateString('he-IL') : '-'}</p>
                                <p><strong>סגירת הרשמה:</strong> {course.enrollmentCloseDate ? new Date(course.enrollmentCloseDate).toLocaleDateString('he-IL') : '-'}</p>
                                <p><strong>מחיר:</strong> ₪{Number(course.coursePrice).toLocaleString('he-IL')}</p>
                                <p>
                                    <strong>סטטוס הרשמה:</strong>{' '}
                                    {course.enrollmentStatus === 'active' ? 'פעיל' : 'לא פעיל'}
                                </p>
                                <p><strong>תאריך יצירה:</strong> {new Date(course.createdAt).toLocaleDateString('he-IL')}</p>

                                <div className="courses-card-actions">
                                    <button type="button" className="courses-primary-button" onClick={() => handleEdit(course)}>
                                        עריכה
                                    </button>
                                    <button type="button" className="courses-danger-button" onClick={() => handleDelete(course)}>
                                        מחיקה
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {isFormVisible && (
                <div className="courses-modal-overlay" onClick={resetForm}>
                    <div className="courses-modal" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="courses-modal-close" onClick={resetForm} aria-label="סגירת חלון">
                            ×
                        </button>

                        <form className="courses-form" onSubmit={handleSubmit}>
                            <h2 className="courses-form-title">{editingCourseId ? 'עריכת קורס' : 'יצירת קורס חדש'}</h2>

                            {error && <p className="courses-message courses-error courses-modal-message">{error}</p>}
                            {successMessage && <p className="courses-message courses-success courses-modal-message">{successMessage}</p>}

                            <label className="courses-label" htmlFor="courseName">שם הקורס</label>
                            <input
                                id="courseName"
                                name="courseName"
                                className="courses-input"
                                value={formData.courseName}
                                onChange={handleChange}
                                placeholder="לדוגמה: JavaScript למתחילים"
                            />

                            <label className="courses-label" htmlFor="lecturerName">שם המרצה</label>
                            <input
                                id="lecturerName"
                                name="lecturerName"
                                className="courses-input"
                                value={formData.lecturerName}
                                onChange={handleChange}
                                placeholder="לדוגמה: דנה כהן"
                            />

                            <label className="courses-label" htmlFor="courseDescription">תיאור הקורס</label>
                            <textarea
                                id="courseDescription"
                                name="courseDescription"
                                className="courses-input courses-textarea"
                                value={formData.courseDescription}
                                onChange={handleChange}
                                placeholder="תיאור קצר של תוכן הקורס"
                                rows="3"
                            />

                            <label className="courses-label" htmlFor="lessonsCount">מספר שיעורים</label>
                            <input
                                id="lessonsCount"
                                name="lessonsCount"
                                type="number"
                                min="0"
                                className="courses-input"
                                value={formData.lessonsCount}
                                onChange={handleChange}
                                placeholder="0"
                            />

                            <label className="courses-label" htmlFor="category">קטגוריה</label>
                            <input
                                id="category"
                                name="category"
                                className="courses-input"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="לדוגמה: פיתוח אתרים"
                            />

                            <label className="courses-label" htmlFor="currentEnrollment">מספר נרשמים נוכחי</label>
                            <input
                                id="currentEnrollment"
                                name="currentEnrollment"
                                type="number"
                                min="0"
                                className="courses-input"
                                value={formData.currentEnrollment}
                                onChange={handleChange}
                                placeholder="0"
                            />

                            <label className="courses-label" htmlFor="courseStartDate">תאריך פתיחת הקורס</label>
                            <input
                                id="courseStartDate"
                                name="courseStartDate"
                                type="date"
                                className="courses-input"
                                value={formData.courseStartDate}
                                onChange={handleChange}
                            />

                            <label className="courses-label" htmlFor="enrollmentCloseDate">סגירת הרשמה</label>
                            <input
                                id="enrollmentCloseDate"
                                name="enrollmentCloseDate"
                                type="date"
                                className="courses-input"
                                value={formData.enrollmentCloseDate}
                                onChange={handleChange}
                            />

                            <label className="courses-label" htmlFor="coursePrice">מחיר הקורס</label>
                            <input
                                id="coursePrice"
                                name="coursePrice"
                                type="number"
                                min="0"
                                className="courses-input"
                                value={formData.coursePrice}
                                onChange={handleChange}
                                placeholder="0"
                            />

                            <label className="courses-label" htmlFor="enrollmentStatus">סטטוס הרשמה</label>
                            <select
                                id="enrollmentStatus"
                                name="enrollmentStatus"
                                className="courses-input"
                                value={formData.enrollmentStatus}
                                onChange={handleChange}
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>

                            <div className="courses-form-actions">
                                <button type="submit" className="courses-primary-button" disabled={isSubmitting}>
                                    {isSubmitting ? 'שומר...' : submitLabel}
                                </button>

                                <button type="button" className="courses-secondary-button" onClick={resetForm}>
                                    סגירה
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CoursesPage;
