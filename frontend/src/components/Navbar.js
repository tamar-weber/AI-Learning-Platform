import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

function Navbar({ currentUser }) {
    const navigate = useNavigate();
    const { logout, updateAuthData } = useAuth();
    const isAdmin = currentUser?.role === 'admin';
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileErrors, setProfileErrors] = useState({});
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                email: currentUser.email || ''
            });
        }
    }, [currentUser]);

    const loadUnreadCount = async () => {
        if (!currentUser) {
            setUnreadCount(0);
            return;
        }

        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to load unread notification count:', error);
        }
    };

    const loadNotifications = async (nextPage = 1) => {
        if (!currentUser) {
            setItems([]);
            return;
        }

        try {
            setIsLoadingNotifications(true);
            const response = await api.get('/notifications', {
                params: { page: nextPage, limit: 5 }
            });

            setItems(response.data.items || []);
            setPage(response.data.pagination?.page || 1);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    useEffect(() => {
        loadUnreadCount();
    }, [currentUser]);

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const togglePanel = async () => {
        const nextOpen = !isPanelOpen;
        setIsPanelOpen(nextOpen);

        if (nextOpen) {
            await loadNotifications(1);
            await loadUnreadCount();
        }
    };

    const handleMarkOneAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            await Promise.all([loadNotifications(page), loadUnreadCount()]);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            await Promise.all([loadNotifications(page), loadUnreadCount()]);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const openEditProfileModal = () => {
        if (!currentUser) {
            return;
        }

        setProfileErrors({});
        setProfileForm({
            name: currentUser.name || '',
            phone: currentUser.phone || '',
            email: currentUser.email || ''
        });
        setIsEditProfileOpen(true);
    };

    const closeEditProfileModal = () => {
        if (isSavingProfile) {
            return;
        }

        setIsEditProfileOpen(false);
        setProfileErrors({});
    };

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((prev) => ({
            ...prev,
            [name]: value
        }));

        if (profileErrors[name] || profileErrors.general) {
            setProfileErrors((prev) => ({
                ...prev,
                [name]: '',
                general: ''
            }));
        }
    };

    const validateProfileForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!profileForm.name.trim()) {
            errors.name = 'נא למלא שם מלא';
        }

        if (!profileForm.phone.trim()) {
            errors.phone = 'נא למלא מספר טלפון';
        }

        if (!profileForm.email.trim()) {
            errors.email = 'נא למלא כתובת אימייל';
        } else if (!emailRegex.test(profileForm.email.trim())) {
            errors.email = 'כתובת אימייל לא תקינה';
        }

        setProfileErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        if (!validateProfileForm()) {
            return;
        }

        setIsSavingProfile(true);

        try {
            const payload = {
                name: profileForm.name.trim(),
                phone: profileForm.phone.trim(),
                email: profileForm.email.trim()
            };

            const response = await api.patch('/profile', payload);
            updateAuthData(response.data);
            setIsEditProfileOpen(false);
        } catch (error) {
            setProfileErrors({
                general: error.response?.data?.error || 'שמירת הפרופיל נכשלה. נסה שוב.'
            });
        } finally {
            setIsSavingProfile(false);
        }
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
                    <div className="navbar-notification-wrapper">
                        <button type="button" className="navbar-notification-button" onClick={togglePanel}>
                            🔔
                            {unreadCount > 0 && <span className="navbar-notification-badge">{unreadCount}</span>}
                        </button>

                        {isPanelOpen && (
                            <div className="navbar-notification-panel">
                                <div className="navbar-notification-header">
                                    <strong>התראות</strong>
                                    <button type="button" className="navbar-mark-all-button" onClick={handleMarkAllAsRead}>
                                        סמן הכל כנקרא
                                    </button>
                                </div>

                                {isLoadingNotifications ? (
                                    <p className="navbar-notification-empty">טוען...</p>
                                ) : items.length === 0 ? (
                                    <p className="navbar-notification-empty">אין התראות כרגע.</p>
                                ) : (
                                    <ul className="navbar-notification-list">
                                        {items.map((item) => (
                                            <li key={item.id} className={`navbar-notification-item ${item.isRead ? 'read' : 'unread'}`}>
                                                <p className="navbar-notification-title">{item.title}</p>
                                                <p className="navbar-notification-message">{item.message}</p>
                                                <div className="navbar-notification-footer">
                                                    <span>{new Date(item.createdAt).toLocaleString('he-IL')}</span>
                                                    {!item.isRead && (
                                                        <button
                                                            type="button"
                                                            className="navbar-mark-one-button"
                                                            onClick={() => handleMarkOneAsRead(item.id)}
                                                        >
                                                            סמן כנקרא
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="navbar-notification-pagination">
                                    <button
                                        type="button"
                                        className="navbar-page-button"
                                        onClick={() => loadNotifications(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        הקודם
                                    </button>
                                    <span>{page} / {totalPages}</span>
                                    <button
                                        type="button"
                                        className="navbar-page-button"
                                        onClick={() => loadNotifications(page + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        הבא
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="navbar-user-name">שלום, {currentUser.name}</span>
                    <button type="button" className="navbar-edit-profile-button" onClick={openEditProfileModal}>
                        ✏️
                    </button>
                    <button type="button" className="navbar-logout-button" onClick={handleLogout}>
                        התנתק
                    </button>
                </div>
            )}

            {isEditProfileOpen && (
                <div className="profile-modal-overlay" onClick={closeEditProfileModal}>
                    <div className="profile-modal-card" onClick={(event) => event.stopPropagation()}>
                        <h3 className="profile-modal-title">עריכת פרופיל</h3>

                        <form className="profile-modal-form" onSubmit={handleSaveProfile}>
                            <label className="profile-modal-label" htmlFor="profile-name">שם</label>
                            <input
                                id="profile-name"
                                name="name"
                                value={profileForm.name}
                                onChange={handleProfileChange}
                                className={`profile-modal-input ${profileErrors.name ? 'error' : ''}`}
                            />
                            {profileErrors.name && <span className="profile-modal-error">{profileErrors.name}</span>}

                            <label className="profile-modal-label" htmlFor="profile-phone">טלפון</label>
                            <input
                                id="profile-phone"
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                                className={`profile-modal-input ${profileErrors.phone ? 'error' : ''}`}
                            />
                            {profileErrors.phone && <span className="profile-modal-error">{profileErrors.phone}</span>}

                            <label className="profile-modal-label" htmlFor="profile-email">אימייל</label>
                            <input
                                id="profile-email"
                                name="email"
                                value={profileForm.email}
                                onChange={handleProfileChange}
                                className={`profile-modal-input ${profileErrors.email ? 'error' : ''}`}
                            />
                            {profileErrors.email && <span className="profile-modal-error">{profileErrors.email}</span>}

                            {profileErrors.general && <div className="profile-modal-general-error">{profileErrors.general}</div>}

                            <div className="profile-modal-actions">
                                <button type="button" className="profile-cancel-button" onClick={closeEditProfileModal} disabled={isSavingProfile}>
                                    ביטול
                                </button>
                                <button type="submit" className="profile-save-button" disabled={isSavingProfile}>
                                    {isSavingProfile ? 'שומר...' : 'שמור'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;