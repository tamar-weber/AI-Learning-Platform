import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar({ currentUser, setCurrentUser }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        // ניקוי המשתמש מה-state ומה-localStorage
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        // העברה לעמוד הבית
        navigate('/');
    };

    const linkStyle = {
        color: '#ecf0f1',
        textDecoration: 'none',
        padding: '10px 15px',
        borderRadius: '5px',
        transition: 'background-color 0.3s'
    };

    const activeLinkStyle = {
        backgroundColor: '#2980b9'
    };

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            backgroundColor: '#34495e',
            color: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
            {/* צד ימין - לוגו וקישורים */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <NavLink to={currentUser ? "/learning" : "/"} style={{...linkStyle, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    🎓 AI-Learn
                </NavLink>
                {currentUser && (
                    <>
                        <NavLink 
                            to="/learning" 
                            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeLinkStyle : {}) })}
                        >
                            צור שיעור
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeLinkStyle : {}) })}
                        >
                            היסטוריה
                        </NavLink>
                        {/* קישור ניהול - רק למנהלים */}
                        {currentUser.role === 'admin' && (
                            <NavLink 
                                to="/admin" 
                                style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeLinkStyle : {}) })}
                            >
                                ניהול
                            </NavLink>
                        )}
                    </>
                )}
            </div>

            {/* צד שמאל - פרטי משתמש והתנתקות */}
            {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ color: '#bdc3c7' }}>שלום, {currentUser.name}</span>
                    <button 
                        onClick={handleLogout}
                        style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        התנתק
                    </button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;