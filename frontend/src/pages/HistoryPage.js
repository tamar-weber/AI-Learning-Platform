import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

function HistoryPage({ currentUser }) {
    const [history, setHistory] = useState([]);
    const [targetUser, setTargetUser] = useState(null);
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
                const historyPromise = axios.get(`${API_URL}/history/user/${targetUserId}`);
                
                let userPromise = null;
                if (userId && currentUser?.role === 'admin') {
                    userPromise = axios.get(`${API_URL}/users`);
                }

                const [historyResponse, usersResponse] = await Promise.all([
                    historyPromise,
                    userPromise
                ]);

                setHistory(historyResponse.data);

                if (usersResponse) {
                    const foundUser = usersResponse.data.find(u => u._id === userId);
                    setTargetUser(foundUser);
                }

            } catch (err) {
                console.error("שגיאה בטעינת היסטוריה:", err);
                setError('לא ניתן היה לטעון את היסטוריית הלמידה.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [userId, currentUser, navigate]);

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>טוען היסטוריה...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>;

    const pageTitle = targetUser 
        ? `היסטוריית הלמידה של ${targetUser.name}`
        : 'היסטוריית הלמידה שלי';

    return (
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{pageTitle}</h1>
            
            {history.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '18px' }}>לא נמצאה היסטוריית למידה.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            <small style={{ color: '#777' }}>נשאל בתאריך: {new Date(item.createdAt).toLocaleString('he-IL')}</small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HistoryPage;
