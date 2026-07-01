import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import { useAuth } from '../context/AuthContext';

function Navbar({ currentUser }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const navItems = [
        { to: '/learning', label: 'צור שיעור', show: Boolean(currentUser) },
        { to: '/history', label: 'היסטוריה', show: Boolean(currentUser) },
        { to: '/my-courses', label: 'הקורסים שלי', show: Boolean(currentUser && !isAdmin) },
        { to: '/admin', label: 'ניהול', show: isAdmin },
        { to: '/courses', label: 'קורסים', show: isAdmin }
    ];

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to={currentUser ? '/learning' : '/'} className={({ isActive }) => `navbar-link navbar-brand ${isActive ? 'active' : ''}`}>
                    🎓 AI-Learn
                </NavLink>

                {navItems.filter((item) => item.show).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </div>

            {currentUser && (
                <div className="navbar-right">
                    <span className="navbar-user-name">שלום, {currentUser.name}</span>
                    <button type="button" className="navbar-logout-button" onClick={handleLogout}>
                        התנתק
                    </button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;