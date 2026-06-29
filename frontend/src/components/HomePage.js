import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homePage.css';

function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <h1 className="home-page-title">🎓 פלטפורמת למידה חכמה</h1>

            <p className="home-page-subtitle">
                למד בעזרת בינה מלאכותית! קבל שיעורים מותאמים אישית בכל נושא שמעניין אותך
            </p>

            <div className="home-page-actions">
                <button
                    onClick={() => navigate('/register')}
                    className="home-page-button home-page-button-primary"
                >
                    🆕 הרשמה חדשה
                </button>

                <button
                    onClick={() => navigate('/login')}
                    className="home-page-button home-page-button-secondary"
                >
                    🔑 כניסה למערכת
                </button>
            </div>

            <div className="home-page-info">
                <h3 className="home-page-info-title">💡 איך זה עובד?</h3>
                <div className="home-page-info-grid">
                    <div className="home-page-info-card">
                        <h4>📝 בחר נושא</h4>
                        <p>בחר מתוך מגוון קטגוריות ונושאים</p>
                    </div>
                    <div className="home-page-info-card">
                        <h4>🤖 שאל שאלה</h4>
                        <p>כתוב מה שמעניין אותך ללמוד</p>
                    </div>
                    <div className="home-page-info-card">
                        <h4>🎓 קבל שיעור</h4>
                        <p>קבל שיעור מותאם אישית מה-AI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;