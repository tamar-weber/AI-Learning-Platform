import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

function AdminPage({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/users`);
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

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>טוען משתמשים...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>ניהול תלמידים</h1>
            
            {users.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '18px' }}>לא נמצאו משתמשים.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {users.map(user => (
                        <div key={user._id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '15px' ,direction: 'rtl'}}>
                            <p><strong>שם:</strong> {user.name}</p>
                            <p><strong>מייל:</strong> {user.email}</p>
                            <p><strong>טלפון:</strong> {user.phone}</p>
                            <button 
                                onClick={() => navigate(`/history/${user._id}`)} 
                                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#3498db', color: '#fff', cursor: 'pointer' }}
                            >
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
