import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import '../styles/coursesPage.css';
import useCourseSearch from '../hooks/useCourseSearch';
import CourseMetaDetails from './CourseMetaDetails';
import PaginationControls from './common/PaginationControls';
import CourseSearchControls from './CourseSearchControls';
import useCoursesList from '../hooks/useCoursesList';
import { COURSES_PAGE_LIMIT } from '../utils/courseConstants';
import CoursesFormModal from './CoursesFormModal';
import { validateCourseForm } from '../utils/courseFormValidation';
import { getCourseDeleteErrorMessage, getCoursesLoadErrorMessage, getCourseSaveErrorMessage } from '../utils/courseApiErrors';

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
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [editingCourseId, setEditingCourseId] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const {
        courses,
        setCourses,
        pagination,
        isLoading,
        loadCourses
    } = useCoursesList({ onlyActive: false, limit: COURSES_PAGE_LIMIT });
    const {
        searchInput,
        searchTerm,
        searchBy,
        page,
        setPage,
        handleSearchInputChange,
        handleSearchByChange
    } = useCourseSearch({ initialSearchBy: 'courseName', debounceMs: 400 });

    const submitLabel = useMemo(() => (
        editingCourseId ? 'שמירת שינויים' : 'יצירת קורס'
    ), [editingCourseId]);

    useEffect(() => {
        loadCourses({
            page: 1,
            search: searchTerm,
            searchBy,
            onError: (err) => {
                console.error('שגיאה בטעינת קורסים:', err);
                setError(getCoursesLoadErrorMessage(err));
            }
        });
    }, []);

    useEffect(() => {
        loadCourses({
            page,
            search: searchTerm,
            searchBy,
            onError: (err) => {
                console.error('שגיאה בטעינת קורסים:', err);
                setError(getCoursesLoadErrorMessage(err));
            }
        });
    }, [page, searchTerm, searchBy]);

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

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationResult = validateCourseForm(formData);

        if (validationResult.error) {
            setError(validationResult.error);
            return;
        }

        const payload = validationResult.payload;

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
            await loadCourses({
                page,
                search: searchTerm,
                searchBy,
                onError: (err) => {
                    console.error('שגיאה בטעינת קורסים:', err);
                    setError(getCoursesLoadErrorMessage(err));
                }
            });
        } catch (err) {
            console.error('שגיאה בשמירת קורס:', err);
            setError(getCourseSaveErrorMessage(err));
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

    const handlePrevPage = () => {
        setPage((current) => Math.max(current - 1, 1));
    };

    const handleNextPage = () => {
        setPage((current) => Math.min(current + 1, pagination.totalPages || 1));
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
            setError(getCourseDeleteErrorMessage(err));
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

            <section className="courses-filters">
                <CourseSearchControls
                    inputClassName="courses-input courses-search-input"
                    selectClassName="courses-input courses-filter-select"
                    searchInput={searchInput}
                    searchBy={searchBy}
                    onSearchInputChange={handleSearchInputChange}
                    onSearchByChange={handleSearchByChange}
                />
            </section>

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
                                <CourseMetaDetails course={course} showDescription showCreatedAt />

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

                <PaginationControls
                    wrapperClassName="courses-pagination"
                    buttonClassName="courses-secondary-button"
                    currentPage={pagination.page || 1}
                    totalPages={pagination.totalPages || 1}
                    statusText={`עמוד ${pagination.page || 1} מתוך ${pagination.totalPages || 1} - ${pagination.total || 0} תוצאות`}
                    onPrevious={handlePrevPage}
                    onNext={handleNextPage}
                    isPreviousDisabled={page <= 1}
                    isNextDisabled={page >= (pagination.totalPages || 1)}
                />
            </section>

            <CoursesFormModal
                isOpen={isFormVisible}
                onClose={resetForm}
                onSubmit={handleSubmit}
                editingCourseId={editingCourseId}
                error={error}
                successMessage={successMessage}
                formData={formData}
                onChange={handleChange}
                statusOptions={STATUS_OPTIONS}
                isSubmitting={isSubmitting}
                submitLabel={submitLabel}
            />
        </div>
    );
}

export default CoursesPage;
