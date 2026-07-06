import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homePage.css';

function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <h1 className="home-page-title">🎓 פלטפורמת למידה חכמה</h1>

            <p className="home-page-subtitle">
                יצירת שיעורים מותאמים אישית בעזרת בינה מלאכותית, לצד מגוון קורסים מקצועיים ללמידה והתקדמות.            </p>

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
                        <h4>🔍 בחרו נושא או קורס</h4>
                        <p>חפשו את התחום שמעניין אתכם.</p>
                    </div>
                    <div className="home-page-info-card">
                        <h4>🤖 צרו או רכשו</h4>
                        <p>צרו שיעור מותאם אישית באמצעות AI או הירשמו לקורס מקצועי.</p>
                    </div>
                    <div className="home-page-info-card">
                        <h4>📈 למדו והתקדמו</h4>
                        <p>המשיכו ללמוד מכל מקום ובכל זמן.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;