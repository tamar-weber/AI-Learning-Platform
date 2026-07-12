import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/historyPage.css';

function HistoryPage({ currentUser }) {
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { userId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const targetUserId = userId || (currentUser ? currentUser._id : null);

        if (!targetUserId) {
            navigate('/login');
            return;
        }

        const fetchHistory = async () => {
            try {

                const response = await api.get(`/history/user/${targetUserId}`);
                setHistory(response.data);

            } catch (err) {
                console.error("שגיאה בטעינת היסטוריה:", err);
                setError('לא ניתן היה לטעון את היסטוריית הלמידה.');
            }
        };

        const fetchUser = async () => {
            try {
                const response = await api.get(`/admin/user/${userId}`);
                setUser(response.data);
            } catch (err) {
                console.error('שגיאה בקבלת משתמש:', err);
                setError('לא ניתן היה לטעון את פרטי המשתמש.');
            }
        };

        const loadPageData = async () => {
            setIsLoading(true);

            await Promise.all([
                fetchHistory(),
                userId && currentUser?.role === 'admin' ? fetchUser() : Promise.resolve()
            ]);

            setIsLoading(false);
        };

        loadPageData();

    }, [userId, currentUser, navigate]);

    if (isLoading) return <div className="history-page">טוען היסטוריה...</div>;
    if (error) return <div className="history-page">{error}</div>;

    const pageTitle = userId && currentUser?.role === 'admin'
        ? `היסטוריית הלמידה של משתמש ${user.name}`
        : 'היסטוריית הלמידה שלי';

    return (
        <div className="history-page">
            <h1 className="history-title">{pageTitle}</h1>

            {history.length === 0 ? (
                <p className="history-empty">לא נמצאה היסטוריית למידה.</p>
            ) : (
                <div className="history-list">
                    {history.map(item => (
                        <div key={item._id} className="history-card">
                            <p><strong>השאלה שנשאלה:</strong> {item.prompt}</p>
                            <p><strong>נושא:</strong> {item.category} {item.subCategory && `→ ${item.subCategory}`}</p>
                            <details>
                                <summary className="history-summary">הצג את תשובת ה-AI</summary>
                                <div className="history-response">{item.response}</div>
                            </details>
                            <small className="history-date">
                                נשאל בתאריך: {new Date(item.createdAt).toLocaleString('he-IL')}
                            </small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HistoryPage;
