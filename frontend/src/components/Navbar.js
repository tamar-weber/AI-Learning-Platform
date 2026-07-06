import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';
import Updatedetails from './Updatedetails';

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
        { to: '/history', label: 'היסטורית שיעורים', show: Boolean(currentUser) },
        { to: '/my-courses', label: 'הקורסים שלי', show: Boolean(currentUser && !isAdmin) },
        { to: '/purchases', label: 'היסטוריית רכישות', show: Boolean(currentUser && !isAdmin) },
        { to: '/activity', label: 'הפעילות שלי', show: Boolean(currentUser && !isAdmin) },
        { to: '/admin', label: 'ניהול תלמידים', show: isAdmin, end: true },
        { to: '/courses', label: 'קורסים', show: isAdmin },
        { to: '/admin/messages', label: 'מרכז הודעות', show: isAdmin },
        { to: '/admin/dashboard', label: 'מרכז הבקרה', show: isAdmin }
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
                        end={Boolean(item.end)}
                        className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </div>

            {currentUser && (
                <div className="navbar-right">
                    <Notifications currentUser={currentUser} />

                    <span className="navbar-user-name">שלום, {currentUser.name}</span>
                    <Updatedetails currentUser={currentUser} />
                    <button type="button" className="navbar-logout-button" onClick={handleLogout}>
                        התנתק
                    </button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;