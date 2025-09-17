// src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const navigate = useNavigate();

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            fontFamily: 'Arial, sans-serif',
            padding: '20px'
        }}>
            {/* כותרת ראשית */}
            <h1 style={{
                fontSize: '3rem',
                color: '#2c3e50',
                marginBottom: '10px',
                textAlign: 'center'
            }}>
                🎓 פלטפורמת הלמידה חכמה
            </h1>
            
            <p style={{
                fontSize: '1.2rem',
                color: '#7f8c8d',
                textAlign: 'center',
                marginBottom: '50px',
                maxWidth: '600px'
            }}>
                למד בעזרת בינה מלאכותית! קבל שיעורים מותאמים אישית בכל נושא שמעניין אותך
            </p>

            {/* מיכל הכפתורים */}
            <div style={{
                display: 'flex',
                gap: '30px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                {/* כפתור הרשמה */}
                <button 
                    onClick={() => navigate('/register')}
                    style={{
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        padding: '20px 40px',
                        fontSize: '1.3rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)',
                        transition: 'all 0.3s ease',
                        minWidth: '200px'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#219a52';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#27ae60';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    🆕 הרשמה חדשה
                </button>

                {/* כפתור כניסה */}
                <button 
                    onClick={() => navigate('/login')}
                    style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '20px 40px',
                        fontSize: '1.3rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                        transition: 'all 0.3s ease',
                        minWidth: '200px'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#2980b9';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#3498db';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    🔑 כניסה למערכת
                </button>
            </div>

            {/* מידע נוסף */}
            <div style={{
                marginTop: '60px',
                textAlign: 'center',
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                maxWidth: '800px'
            }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
                    💡 איך זה עובד?
                </h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px',
                    textAlign: 'center' 
                }}>
                    <div>
                        <h4 style={{ color: '#27ae60' }}>📝 בחר נושא</h4>
                        <p>בחר מתוך מגוון קטגוריות ונושאים</p>
                    </div>
                    <div>
                        <h4 style={{ color: '#e74c3c' }}>🤖 שאל שאלה</h4>
                        <p>כתוב מה שמעניין אותך ללמוד</p>
                    </div>
                    <div>
                        <h4 style={{ color: '#9b59b6' }}>🎓 קבל שיעור</h4>
                        <p>קבל שיעור מותאם אישית מה-AI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;