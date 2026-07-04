import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/myCoursesPage.css';

function MyCoursesPage({ currentUser }) {
    const [myCourses, setMyCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState('courseName');
    const [coursesPage, setCoursesPage] = useState(1);
    const [coursesPagination, setCoursesPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadAvailableCourses = async ({ page = coursesPage, search = searchTerm, selectedSearchBy = searchBy } = {}) => {
        const response = await api.get('/courses', {
            params: {
                page,
                limit: 8,
                search,
                searchBy: selectedSearchBy,
                onlyActive: true
            }
        });

        setAllCourses(response.data.items || []);
        setCoursesPagination(response.data.pagination || { page, limit: 8, total: 0, totalPages: 1 });
    };

    const loadData = async () => {
        if (!currentUser?._id) {
            return;
        }

        try {
            setError('');
            const myCoursesResponse = await api.get(`/my-courses/${currentUser._id}`);

            setMyCourses(myCoursesResponse.data);
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

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchTerm(searchInput);
            setCoursesPage(1);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        if (!currentUser?._id) {
            return;
        }

        const loadFilteredCourses = async () => {
            try {
                await loadAvailableCourses({ page: coursesPage, search: searchTerm, selectedSearchBy: searchBy });
            } catch (err) {
                console.error('שגיאה בטעינת קורסים זמינים:', err);
                setError('לא ניתן היה לטעון את הקורסים הזמינים כרגע.');
            }
        };

        loadFilteredCourses();
    }, [coursesPage, searchTerm, searchBy, currentUser]);

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

            const response = await api.post('/my-courses/checkout-session', {
                userId: currentUser._id,
                courseId
            });

            if (!response.data.checkoutUrl) {
                throw new Error('לא התקבל קישור תשלום מ-Stripe');
            }

            window.location.href = response.data.checkoutUrl;
        } catch (err) {
            console.error('שגיאה ברכישת קורס:', err);
            setError(err.response?.data?.error || 'לא ניתן היה לרכוש את הקורס.');
        } finally {
            setIsPurchasing('');
        }
    };

    const handleSearchInputChange = (event) => {
        setSearchInput(event.target.value);
    };

    const handleSearchByChange = (event) => {
        setSearchBy(event.target.value);
        setSearchInput('');
        setSearchTerm('');
        setCoursesPage(1);
    };

    const handlePreviousAvailablePage = () => {
        setCoursesPage((current) => Math.max(current - 1, 1));
    };

    const handleNextAvailablePage = () => {
        setCoursesPage((current) => Math.min(current + 1, coursesPagination.totalPages || 1));
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get('payment');

        if (paymentStatus === 'success') {
            setSuccessMessage('התשלום אושר. מעדכנים את סטטוס ההרשמה...');

            let attempts = 0;
            const intervalId = setInterval(async () => {
                attempts += 1;
                await loadData();

                if (attempts >= 5) {
                    clearInterval(intervalId);
                    setSuccessMessage('התשלום אושר. אם הקורס עדיין לא מופיע, רענן את העמוד בעוד מספר שניות.');
                }
            }, 2000);

            window.history.replaceState({}, '', '/my-courses');

            return () => clearInterval(intervalId);
        }

        if (paymentStatus === 'cancel') {
            setError('התשלום בוטל לפני השלמה.');
            window.history.replaceState({}, '', '/my-courses');
        }
    }, []);

    if (isLoading) {
        return <div className="my-courses-page">טוען קורסים...</div>;
    }

    return (
        <div className="my-courses-page">
            <h1 className="my-courses-title">הקורסים שלי</h1>

            {error && <p className="my-courses-message my-courses-error">{error}</p>}
            {successMessage && <p className="my-courses-message my-courses-success">{successMessage}</p>}

            <section className="my-courses-section">
                <h2 className="my-courses-section-title">חיפוש קורסים זמינים</h2>

                <div className="my-courses-filters">
                    <input
                        type="search"
                        className="my-courses-search-input"
                        value={searchInput}
                        onChange={handleSearchInputChange}
                        placeholder={
                            searchBy === 'courseName'
                                ? 'הקלד שם קורס'
                                : searchBy === 'category'
                                    ? 'הקלד קטגוריה'
                                    : 'הקלד שם מרצה'
                        }
                    />
                     <select className="my-courses-filter-select" value={searchBy} onChange={handleSearchByChange}>
                        <option value="courseName">חיפוש לפי שם קורס</option>
                        <option value="category">חיפוש לפי קטגוריה</option>
                        <option value="lecturerName">חיפוש לפי מרצה</option>
                    </select>
                </div>
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
                                <p><strong>מספר שיעורים:</strong> {course.lessonsCount ?? '-'}</p>
                                <p><strong>תאריך פתיחת קורס:</strong> {course.courseStartDate ? new Date(course.courseStartDate).toLocaleDateString('he-IL') : '-'}</p>
                                <p><strong>סגירת הרשמה:</strong> {course.enrollmentCloseDate ? new Date(course.enrollmentCloseDate).toLocaleDateString('he-IL') : '-'}</p>
                                <p><strong>סטטוס הרשמה:</strong> {course.enrollmentStatus === 'active' ? 'פעיל' : 'לא פעיל'}</p>
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
                                <p><strong>תאריך פתיחת קורס:</strong> {course.courseStartDate ? new Date(course.courseStartDate).toLocaleDateString('he-IL') : '-'}</p>
                                <p><strong>סגירת הרשמה:</strong> {course.enrollmentCloseDate ? new Date(course.enrollmentCloseDate).toLocaleDateString('he-IL') : '-'}</p>
                                <p><strong>סטטוס הרשמה:</strong> {course.enrollmentStatus === 'active' ? 'פעיל' : 'לא פעיל'}</p>
                                <p><strong>מחיר:</strong> ₪{Number(course.coursePrice).toLocaleString('he-IL')}</p>
                                <p><strong>נרכש בתאריך:</strong> {course.purchasedAt ? new Date(course.purchasedAt).toLocaleDateString('he-IL') : '-'}</p>
                            </article>
                        ))}
                    </div>
                )}

                <div className="my-courses-pagination">
                    <button
                        type="button"
                        className="my-courses-buy-button"
                        onClick={handlePreviousAvailablePage}
                        disabled={coursesPage <= 1}
                    >
                        הקודם
                    </button>
                    <span>{coursesPagination.page} / {coursesPagination.totalPages}</span>
                    <button
                        type="button"
                        className="my-courses-buy-button"
                        onClick={handleNextAvailablePage}
                        disabled={coursesPage >= (coursesPagination.totalPages || 1)}
                    >
                        הבא
                    </button>
                </div>
            </section>
        </div>
    );
}

export default MyCoursesPage;
