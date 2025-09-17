import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// Import Pages
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import LearningPage from './pages/LearningPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';

function App() {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = localStorage.getItem('currentUser');
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        // מפנה לעמוד הבית לאחר התנתקות
        window.location.href = '/'; 
    };

    return (
        <Router>
            <nav style={{ padding: '10px 20px', backgroundColor: '#34495e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '20px' }}>🎓 AI למידה</Link>
                <div>
                    {currentUser && (
                        <>
                            <Link to="/learning" style={{ color: 'white', margin: '0 10px' }}>יצירת שיעור</Link>
                            <Link to="/history" style={{ color: 'white', margin: '0 10px' }}>היסטוריה</Link>
                            {currentUser.role === 'admin' && (
                                <Link to="/admin" style={{ color: 'white', margin: '0 10px', fontWeight: 'bold' }}>ניהול</Link>
                            )}
                            <button onClick={handleLogout} style={{ marginLeft: '20px', background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px' }}>התנתק</button>
                        </>
                    )}
                </div>
            </nav>

            <main>
                <Routes>
                    <Route path="/" element={!currentUser ? <HomePage /> : <Navigate to="/learning" />} />
                    <Route path="/register" element={!currentUser ? <RegisterPage /> : <Navigate to="/learning" />} />
                    <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/learning" />} />
                    
                    <Route path="/learning" element={currentUser ? <LearningPage currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
                
                    <Route path="/history/:userId?" element={currentUser ? <HistoryPage currentUser={currentUser} /> : <Navigate to="/login" />} />
                    
                    <Route path="/admin" element={currentUser && currentUser.role === 'admin' ? <AdminPage /> : <Navigate to="/" />} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;