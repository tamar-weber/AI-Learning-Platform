import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/adminDashboardPage.css';

function AdminDashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        rangeStart: '',
        rangeEnd: ''
    });

    const loadDashboard = async (nextFilters = filters) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await api.get('/admin/dashboard', {
                params: {
                    rangeStart: nextFilters.rangeStart || undefined,
                    rangeEnd: nextFilters.rangeEnd || undefined
                }
            });

            setDashboard(response.data);
        } catch (err) {
            console.error('שגיאה בטעינת מרכז הבקרה:', err);
            setError(err.response?.data?.error || 'לא ניתן היה לטעון את נתוני מרכז הבקרה.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilters = async (event) => {
        event.preventDefault();
        await loadDashboard(filters);
    };

    if (isLoading && !dashboard) {
        return <div className="admin-dashboard-page">טוען נתוני מרכז הבקרה...</div>;
    }

    if (error) {
        return <div className="admin-dashboard-page admin-dashboard-error">{error}</div>;
    }

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-header">
                <h1 className="admin-dashboard-title">מרכז הבקרה</h1>
                <p className="admin-dashboard-subtitle">תצוגה מרכזית למערכת כולה</p>
            </div>

            <form className="admin-dashboard-filters" onSubmit={handleApplyFilters}>
                <label className="admin-dashboard-filter-field">
                    <span>מתאריך</span>
                    <input type="date" name="rangeStart" value={filters.rangeStart} onChange={handleFilterChange} />
                </label>
                <label className="admin-dashboard-filter-field">
                    <span>עד תאריך</span>
                    <input type="date" name="rangeEnd" value={filters.rangeEnd} onChange={handleFilterChange} />
                </label>
                <button type="submit" className="admin-dashboard-filter-button">
                    החל סינון
                </button>
            </form>

            <section className="admin-dashboard-kpis">
                <article className="admin-dashboard-card">
                    <span>סה״כ משתמשים</span>
                    <strong>{dashboard.kpis.totalUsers}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>משתמשים חדשים</span>
                    <strong>{dashboard.kpis.newUsers}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>קורסים</span>
                    <strong>{dashboard.kpis.totalCourses}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>נרשמים</span>
                    <strong>{dashboard.kpis.enrollments}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>הכנסות</span>
                    <strong>{dashboard.kpis.revenue}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>קורסים פעילים</span>
                    <strong>{dashboard.kpis.activeCourses}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>התראות שנשלחו</span>
                    <strong>{dashboard.kpis.notificationsSent}</strong>
                </article>
                <article className="admin-dashboard-card">
                    <span>הודעות שנשלחו</span>
                    <strong>{dashboard.kpis.messagesSent}</strong>
                </article>
            </section>

            <section className="admin-dashboard-grid">
                <div className="admin-dashboard-panel">
                    <h2>הרשמות אחרונות</h2>
                    {dashboard.latestRegistrations.length === 0 ? (
                        <p className="admin-dashboard-empty">אין נתונים להצגה.</p>
                    ) : (
                        dashboard.latestRegistrations.map((user) => (
                            <div key={user.id} className="admin-dashboard-row">
                                <strong>{user.name}</strong>
                                <span>{user.email}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="admin-dashboard-panel">
                    <h2>רכישות אחרונות</h2>
                    {dashboard.latestPurchases.length === 0 ? (
                        <p className="admin-dashboard-empty">אין נתונים להצגה.</p>
                    ) : (
                        dashboard.latestPurchases.map((purchase) => (
                            <div key={purchase.id} className="admin-dashboard-row">
                                <strong>{purchase.courseName}</strong>
                                <span>{purchase.userName}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="admin-dashboard-grid">
                <div className="admin-dashboard-panel">
                    <h2>קורסים פופולריים</h2>
                    {dashboard.popularCourses.length === 0 ? (
                        <p className="admin-dashboard-empty">אין נתונים להצגה.</p>
                    ) : (
                        dashboard.popularCourses.map((course) => (
                            <div key={course.id} className="admin-dashboard-row">
                                <strong>{course.courseName}</strong>
                                <span>{course.enrollments} נרשמים</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="admin-dashboard-panel">
                    <h2>הכנסות שנתיות</h2>
                    {dashboard.revenueStats.yearly.length === 0 ? (
                        <p className="admin-dashboard-empty">אין נתונים להצגה.</p>
                    ) : (
                        dashboard.revenueStats.yearly.map((item) => (
                            <div key={item.year} className="admin-dashboard-row">
                                <strong>{item.year}</strong>
                                <span>{item.revenue}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

export default AdminDashboardPage;
