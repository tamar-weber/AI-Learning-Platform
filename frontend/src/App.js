import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import LearningPage from './pages/LearningPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
    const { currentUser } = useAuth();

    return (
        <Router>
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
        </Router>
    );
}

export default App;