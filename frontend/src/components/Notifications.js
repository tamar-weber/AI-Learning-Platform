import React, { useEffect, useState } from 'react';
import api from '../api/api';

function Notifications({ currentUser }) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

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

    return (
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
    );
}

export default Notifications;
