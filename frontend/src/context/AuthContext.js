import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            return null;
        }

        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object' && parsed.token) {
            const { token, ...userWithoutToken } = parsed;
            return userWithoutToken;
        }

        return parsed;
    });
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || '');

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }

        if (authToken) {
            localStorage.setItem('authToken', authToken);
        } else {
            localStorage.removeItem('authToken');
        }
    }, [currentUser, authToken]);

    const login = (authData) => {
        const sourceUser = authData?.user || authData || null;
        const token = authData?.token || '';
        const { token: _ignoredToken, ...user } = sourceUser || {};

        setCurrentUser(sourceUser ? user : null);
        setAuthToken(token);
    };

    const updateAuthData = (authData) => {
        const sourceUser = authData?.user || null;
        const token = authData?.token || '';

        if (!sourceUser) {
            return;
        }

        const { token: _ignoredToken, ...user } = sourceUser;
        setCurrentUser(user);

        if (token) {
            setAuthToken(token);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setAuthToken('');
    };

    const value = useMemo(() => ({
        currentUser,
        authToken,
        login,
        updateAuthData,
        logout,
        setCurrentUser,
        setAuthToken,
        isAuthenticated: Boolean(currentUser)
    }), [currentUser, authToken]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
