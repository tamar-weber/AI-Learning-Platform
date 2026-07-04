import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import LearningPage from './components/LearningPage';
import HistoryPage from './components/HistoryPage';
import ActivityPage from './components/ActivityPage';
import MyCoursesPage from './components/MyCoursesPage';
import PurchaseHistoryPage from './components/PurchaseHistoryPage';
import AdminPage from './components/AdminPage';
import AdminMessagingPage from './components/AdminMessagingPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import CoursesPage from './components/CoursesPage';
import Navbar from './components/Navbar';
import RagChatWidget from './components/RagChatWidget';
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
            {currentUser && <RagChatWidget currentUser={currentUser} />}

            <main>
                <Routes>
                    <Route path="/" element={!currentUser ? <HomePage /> : <Navigate to="/learning" replace />} />
                    <Route path="/register" element={!currentUser ? <RegisterPage /> : <Navigate to="/learning" replace />} />
                    <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/learning" replace />} />
                    <Route path="/forgot-password" element={!currentUser ? <ForgotPasswordPage /> : <Navigate to="/learning" replace />} />
                    <Route path="/reset-password" element={!currentUser ? <ResetPasswordPage /> : <Navigate to="/learning" replace />} />

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
                        path="/activity"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser)} redirectTo="/login">
                                <ActivityPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-courses"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser && currentUser.role !== 'admin')} redirectTo="/">
                                <MyCoursesPage currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/purchases"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser && currentUser.role !== 'admin')} redirectTo="/">
                                <PurchaseHistoryPage />
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

                    <Route
                        path="/admin/messages"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser && currentUser.role === 'admin')} redirectTo="/">
                                <AdminMessagingPage currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser && currentUser.role === 'admin')} redirectTo="/">
                                <AdminDashboardPage currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/courses"
                        element={
                            <ProtectedRoute isAllowed={Boolean(currentUser && currentUser.role === 'admin')} redirectTo="/">
                                <CoursesPage currentUser={currentUser} />
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
