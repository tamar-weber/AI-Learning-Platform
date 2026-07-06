import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/myCoursesPage.css';
import useCourseSearch from '../hooks/useCourseSearch';
import CourseMetaDetails from './CourseMetaDetails';
import PaginationControls from './common/PaginationControls';
import CourseSearchControls from './CourseSearchControls';
import useCoursesList from '../hooks/useCoursesList';
import { COURSES_PAGE_LIMIT } from '../utils/courseConstants';
import { getCoursesLoadErrorMessage, getCoursePurchaseErrorMessage } from '../utils/courseApiErrors';

function MyCoursesPage({ currentUser }) {
    const [myCourses, setMyCourses] = useState([]);
    const [isPurchasing, setIsPurchasing] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const {
        courses: allCourses,
        pagination: coursesPagination,
        isLoading,
        setIsLoading,
        loadCourses: loadAvailableCourses
    } = useCoursesList({ onlyActive: true, limit: COURSES_PAGE_LIMIT });
    const {
        searchInput,
        searchTerm,
        searchBy,
        page: coursesPage,
        setPage: setCoursesPage,
        handleSearchInputChange,
        handleSearchByChange
    } = useCourseSearch({ initialSearchBy: 'courseName', debounceMs: 400 });

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
            setError(getCoursesLoadErrorMessage(err, 'לא ניתן היה לטעון את הקורסים כרגע.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?._id) {
            return;
        }

        const loadFilteredCourses = async () => {
            await loadAvailableCourses({
                page: coursesPage,
                search: searchTerm,
                searchBy,
                onError: (err) => {
                    console.error('שגיאה בטעינת קורסים זמינים:', err);
                    setError(getCoursesLoadErrorMessage(err, 'לא ניתן היה לטעון את הקורסים הזמינים כרגע.'));
                }
            });
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
            setError(getCoursePurchaseErrorMessage(err));
        } finally {
            setIsPurchasing('');
        }
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

                <CourseSearchControls
                    wrapperClassName="my-courses-filters"
                    inputClassName="my-courses-search-input"
                    selectClassName="my-courses-filter-select"
                    searchInput={searchInput}
                    searchBy={searchBy}
                    onSearchInputChange={handleSearchInputChange}
                    onSearchByChange={handleSearchByChange}
                />
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
                                <CourseMetaDetails course={course} showDescription />
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
                                <CourseMetaDetails course={course} showPurchasedAt />
                            </article>
                        ))}
                    </div>
                )}

                <PaginationControls
                    wrapperClassName="my-courses-pagination"
                    buttonClassName="my-courses-buy-button"
                    currentPage={coursesPagination.page}
                    totalPages={coursesPagination.totalPages}
                    onPrevious={handlePreviousAvailablePage}
                    onNext={handleNextAvailablePage}
                    isPreviousDisabled={coursesPage <= 1}
                    isNextDisabled={coursesPage >= (coursesPagination.totalPages || 1)}
                />
            </section>
        </div>
    );
}

export default MyCoursesPage;
