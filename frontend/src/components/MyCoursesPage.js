import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/myCoursesPage.css';

function MyCoursesPage({ currentUser }) {
    const [myCourses, setMyCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadData = async () => {
        if (!currentUser?._id) {
            return;
        }

        try {
            setError('');
            const [myCoursesResponse, allCoursesResponse] = await Promise.all([
                api.get(`/my-courses/${currentUser._id}`),
                api.get('/courses')
            ]);

            setMyCourses(myCoursesResponse.data);
            setAllCourses(allCoursesResponse.data);
        } catch (err) {
            console.error('שגיאה בטעינת קורסים:', err);
            setError('לא ניתן היה לטעון את הקורסים כרגע.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const purchasedCourseIds = new Set(myCourses.map((course) => course.id));

    const availableCourses = allCourses.filter((course) => !purchasedCourseIds.has(course.id));

    const handlePurchase = async (courseId) => {
        if (!currentUser?._id) {
            return;
        }

        try {
            setError('');
            setSuccessMessage('');
            setIsPurchasing(courseId);

            const response = await api.post('/my-courses/purchase', {
                userId: currentUser._id,
                courseId
            });

            setSuccessMessage(`רכשת בהצלחה את הקורס "${response.data.courseName}".`);
            await loadData();
        } catch (err) {
            console.error('שגיאה ברכישת קורס:', err);
            setError(err.response?.data?.error || 'לא ניתן היה לרכוש את הקורס.');
        } finally {
            setIsPurchasing('');
        }
    };

    if (isLoading) {
        return <div className="my-courses-page">טוען קורסים...</div>;
    }

    return (
        <div className="my-courses-page">
            <h1 className="my-courses-title">הקורסים שלי</h1>

            {error && <p className="my-courses-message my-courses-error">{error}</p>}
            {successMessage && <p className="my-courses-message my-courses-success">{successMessage}</p>}

            <section className="my-courses-section">
                <h2 className="my-courses-section-title">קורסים שרכשתי</h2>

                {myCourses.length === 0 ? (
                    <p className="my-courses-empty">עדיין לא רכשת קורסים.</p>
                ) : (
                    <div className="my-courses-grid">
                        {myCourses.map((course) => (
                            <article key={course.id} className="my-courses-card">
                                <h3>{course.courseName}</h3>
                                <p><strong>מרצה:</strong> {course.lecturerName}</p>
                                <p><strong>קטגוריה:</strong> {course.category || '-'}</p>
                                <p><strong>מספר שיעורים:</strong> {course.lessonsCount ?? '-'}</p>
                                <p><strong>מחיר:</strong> ₪{Number(course.coursePrice).toLocaleString('he-IL')}</p>
                                <p><strong>נרכש בתאריך:</strong> {course.purchasedAt ? new Date(course.purchasedAt).toLocaleDateString('he-IL') : '-'}</p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="my-courses-section">
                <h2 className="my-courses-section-title">קורסים זמינים לרכישה</h2>

                {availableCourses.length === 0 ? (
                    <p className="my-courses-empty">אין כרגע קורסים זמינים לרכישה.</p>
                ) : (
                    <div className="my-courses-grid">
                        {availableCourses.map((course) => (
                            <article key={course.id} className="my-courses-card">
                                <h3>{course.courseName}</h3>
                                <p><strong>מרצה:</strong> {course.lecturerName}</p>
                                <p><strong>תיאור:</strong> {course.courseDescription || '-'}</p>
                                <p><strong>קטגוריה:</strong> {course.category || '-'}</p>
                                <p><strong>מחיר:</strong> ₪{Number(course.coursePrice).toLocaleString('he-IL')}</p>
                                <button
                                    type="button"
                                    className="my-courses-buy-button"
                                    onClick={() => handlePurchase(course.id)}
                                    disabled={isPurchasing === course.id}
                                >
                                    {isPurchasing === course.id ? 'רוכש...' : 'רכישת קורס'}
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default MyCoursesPage;
