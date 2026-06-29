import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import LearningPage from './components/LearningPage';
import HistoryPage from './components/HistoryPage';
import AdminPage from './components/AdminPage';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, isAllowed, redirectTo = '/login' }) {
    if (!isAllowed) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}

function AppRouter() {
    const { currentUser } = useAuth();

    return (
        <>
            <Navbar currentUser={currentUser} />

            <main>
                <Routes>
                    <Route path="/" element={!currentUser ? <HomePage /> : <Navigate to="/learning" replace />} />
                    <Route path="/register" element={!currentUser ? <RegisterPage /> : <Navigate to="/learning" replace />} />
                    <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/learning" replace />} />

                    <Route
                        path="/learning"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser)} redirectTo="/login">
                                <LearningPage currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/history/:userId?"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser)} redirectTo="/login">
                                <HistoryPage currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser && currentUser.role === 'admin')} redirectTo="/">
                                <AdminPage currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </>
    );
}

export default AppRouter;
