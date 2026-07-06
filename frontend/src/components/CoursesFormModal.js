import React from 'react';

function CoursesFormModal({
    isOpen,
    onClose,
    onSubmit,
    editingCourseId,
    error,
    successMessage,
    formData,
    onChange,
    statusOptions,
    isSubmitting,
    submitLabel
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="courses-modal-overlay" onClick={onClose}>
            <div className="courses-modal" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="courses-modal-close" onClick={onClose} aria-label="סגירת חלון">
                    ×
                </button>

                <form className="courses-form" onSubmit={onSubmit}>
                    <h2 className="courses-form-title">{editingCourseId ? 'עריכת קורס' : 'יצירת קורס חדש'}</h2>

                    {error && <p className="courses-message courses-error courses-modal-message">{error}</p>}
                    {successMessage && <p className="courses-message courses-success courses-modal-message">{successMessage}</p>}

                    <label className="courses-label" htmlFor="courseName">שם הקורס</label>
                    <input
                        id="courseName"
                        name="courseName"
                        className="courses-input"
                        value={formData.courseName}
                        onChange={onChange}
                        placeholder="לדוגמה: JavaScript למתחילים"
                    />

                    <label className="courses-label" htmlFor="lecturerName">שם המרצה</label>
                    <input
                        id="lecturerName"
                        name="lecturerName"
                        className="courses-input"
                        value={formData.lecturerName}
                        onChange={onChange}
                        placeholder="לדוגמה: דנה כהן"
                    />

                    <label className="courses-label" htmlFor="courseDescription">תיאור הקורס</label>
                    <textarea
                        id="courseDescription"
                        name="courseDescription"
                        className="courses-input courses-textarea"
                        value={formData.courseDescription}
                        onChange={onChange}
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
                        onChange={onChange}
                        placeholder="0"
                    />

                    <label className="courses-label" htmlFor="category">קטגוריה</label>
                    <input
                        id="category"
                        name="category"
                        className="courses-input"
                        value={formData.category}
                        onChange={onChange}
                        placeholder="לדוגמה: פיתוח אתרים"
                    />

                    <label className="courses-label" htmlFor="courseStartDate">תאריך פתיחת הקורס</label>
                    <input
                        id="courseStartDate"
                        name="courseStartDate"
                        type="date"
                        className="courses-input"
                        value={formData.courseStartDate}
                        onChange={onChange}
                    />

                    <label className="courses-label" htmlFor="enrollmentCloseDate">סגירת הרשמה</label>
                    <input
                        id="enrollmentCloseDate"
                        name="enrollmentCloseDate"
                        type="date"
                        className="courses-input"
                        value={formData.enrollmentCloseDate}
                        onChange={onChange}
                    />

                    <label className="courses-label" htmlFor="coursePrice">מחיר הקורס</label>
                    <input
                        id="coursePrice"
                        name="coursePrice"
                        type="number"
                        min="0"
                        className="courses-input"
                        value={formData.coursePrice}
                        onChange={onChange}
                        placeholder="0"
                    />

                    <label className="courses-label" htmlFor="enrollmentStatus">סטטוס הרשמה</label>
                    <select
                        id="enrollmentStatus"
                        name="enrollmentStatus"
                        className="courses-input"
                        value={formData.enrollmentStatus}
                        onChange={onChange}
                    >
                        {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>

                    <div className="courses-form-actions">
                        <button type="submit" className="courses-primary-button" disabled={isSubmitting}>
                            {isSubmitting ? 'שומר...' : submitLabel}
                        </button>

                        <button type="button" className="courses-secondary-button" onClick={onClose}>
                            סגירה
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CoursesFormModal;
