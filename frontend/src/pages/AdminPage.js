import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/adminPage.css';

function AdminPage({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                setUsers(response.data);
            } catch (err) {
                console.error("שגיאה בטעינת משתמשים:", err);
                setError('לא ניתן היה לטעון את רשימת המשתמשים.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (isLoading) return <div className="admin-page">טוען משתמשים...</div>;
    if (error) return <div className="admin-page">{error}</div>;

    return (
        <div className="admin-page">
            <h1 className="admin-title">ניהול תלמידים</h1>

            {users.length === 0 ? (
                <p className="admin-empty">לא נמצאו משתמשים.</p>
            ) : (
                <div className="admin-list">
                    {users.map(user => (
                        <div key={user._id} className="admin-card">
                            <p><strong>שם:</strong> {user.name}</p>
                            <p><strong>מייל:</strong> {user.email}</p>
                            <p><strong>טלפון:</strong> {user.phone}</p>
                            <button onClick={() => navigate(`/history/${user._id}`)} className="admin-button">
                                צפייה בהיסטוריה
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminPage;
