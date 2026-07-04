import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import trashIcon from '../Icon/trash.svg';
import '../styles/adminPage.css';

function AdminPage({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                setUsers(response.data.filter(user => user.role === 'student' && user._id !== currentUser?._id));
            } catch (err) {
                console.error("שגיאה בטעינת משתמשים:", err);
                setError('לא ניתן היה לטעון את רשימת המשתמשים.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser]);

    const handleDeleteUser = async (userId) => {
        const confirmDelete = window.confirm('האם למחוק את התלמיד? פעולה זו אינה ניתנת לביטול.');

        if (!confirmDelete) {
            return;
        }

        try {
            setActionError('');
            await api.delete(`/admin/user/${userId}`);
            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        } catch (err) {
            console.error('שגיאה במחיקת משתמש:', err);
            setActionError(err.response?.data?.error || 'לא ניתן היה למחוק את המשתמש.');
        }
    };

    if (isLoading) return <div className="admin-page">טוען משתמשים...</div>;
    if (error) return <div className="admin-page">{error}</div>;

    return (
        <div className="admin-page">
            <h1 className="admin-title">ניהול תלמידים</h1>
            {actionError && <p className="admin-error">{actionError}</p>}

            {users.length === 0 ? (
                <p className="admin-empty">לא נמצאו משתמשים.</p>
            ) : (
                <div className="admin-list">
                    {users.map(user => (
                        <div key={user._id} className="admin-card">
                            <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="admin-delete-icon-button"
                                aria-label={`מחיקת התלמיד ${user.name}`}
                                title="מחיקת תלמיד"
                            >
                                <img src={trashIcon} alt="" className="admin-delete-icon" />
                            </button>
                            <p><strong>שם:</strong> {user.name}</p>
                            <p><strong>מייל:</strong> {user.email}</p>
                            <p><strong>טלפון:</strong> {user.phone}</p>
                            <button onClick={() => navigate(`/history/${user._id}`)} className="admin-button">
                               צפייה בהיסטוריית שיעורים
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminPage;
