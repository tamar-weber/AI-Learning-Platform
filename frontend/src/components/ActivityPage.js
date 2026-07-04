import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/activityPage.css';
import { formatActivityType } from '../utils/displayLabels';

function ActivityPage() {
    const [activity, setActivity] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadActivity = async (targetPage = 1) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await api.get('/activity', {
                params: { page: targetPage, limit: 10 }
            });

            setActivity(response.data.items || []);
            setPage(response.data.pagination?.page || 1);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('שגיאה בטעינת פעילות משתמש:', err);
            setError('לא ניתן היה לטעון את הפעילות שלך כרגע.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadActivity(1);
    }, []);

    return (
        <div className="activity-page">
            <h1 className="activity-page-title">הפעילות שלי</h1>

            {isLoading ? (
                <p className="activity-page-empty">טוען פעילות...</p>
            ) : error ? (
                <p className="activity-page-error">{error}</p>
            ) : activity.length === 0 ? (
                <p className="activity-page-empty">אין פעילות להצגה.</p>
            ) : (
                <div className="activity-page-list">
                    {activity.map((item) => (
                        <div key={item.id} className="activity-page-card">
                            <p><strong>סוג פעולה:</strong> {formatActivityType(item.type)}</p>
                            <p><strong>פירוט:</strong> {item.description}</p>
                            <small className="activity-page-date">{new Date(item.timestamp).toLocaleString('he-IL')}</small>
                        </div>
                    ))}
                </div>
            )}

            <div className="activity-page-pagination">
                <button
                    type="button"
                    className="activity-page-button"
                    onClick={() => loadActivity(page - 1)}
                    disabled={page <= 1 || isLoading}
                >
                    הקודם
                </button>
                <span>{page} / {totalPages}</span>
                <button
                    type="button"
                    className="activity-page-button"
                    onClick={() => loadActivity(page + 1)}
                    disabled={page >= totalPages || isLoading}
                >
                    הבא
                </button>
            </div>
        </div>
    );
}

export default ActivityPage;
