// src/pages/HistoryPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

function HistoryPage({ currentUser }) {
    const [history, setHistory] = useState([]);
    const [user, setuser] = useState({});
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
                // ✅ לוג של ה־userId שנשלח לשרת
                console.log("userId שנשלח:", targetUserId);

                const response = await axios.get(`${API_URL}/history/user/${targetUserId}`);
                setHistory(response.data);

            } catch (err) {
                console.error("שגיאה בטעינת היסטוריה:", err);
                setError('לא ניתן היה לטעון את היסטוריית הלמידה.');
            } finally {
                setIsLoading(false);
            }
        };
        const fetchUser = async () => {
            try {

                const response = await axios.get(`${API_URL}/admin/user/${userId}`);
                setuser(response.data);

            } catch (err) {
                console.error("שגיאה בקבלת משתמש:", err);
                setError('לא ניתן היה לטעון את היסטוריית הלמידה.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
        if (userId && currentUser?.role === 'admin') {
            fetchUser()
        }

    }, [userId, currentUser, navigate]);

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>טוען היסטוריה...</div>;
    // if (error) return <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>;

    const pageTitle = userId && currentUser?.role === 'admin'
        ? `היסטוריית הלמידה של משתמש ${user.name}`
        : 'היסטוריית הלמידה שלי';

    return (
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{pageTitle}</h1>

            {history.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '18px' }}>לא נמצאה היסטוריית למידה.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl' }}>
                    {history.map(item => (
                        <div key={item._id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px' }}>
                            <p><strong>השאלה שנשאלה:</strong> {item.prompt}</p>
                            <p><strong>נושא:</strong> {item.category} {item.sub_category && `→ ${item.sub_category}`}</p>
                            <details>
                                <summary style={{ cursor: 'pointer', color: '#3498db' }}>הצג את תשובת ה-AI</summary>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '10px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
                                    {item.response}
                                </div>
                            </details>
                            <small style={{ color: '#777' }}>
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
