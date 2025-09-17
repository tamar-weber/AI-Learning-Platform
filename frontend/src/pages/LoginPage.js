import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        idNumber: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // תעודת זהות: ספרות בלבד, עד 9 תווים
        if (name === 'idNumber') {
            const numbersOnly = value.replace(/[^0-9]/g, '');
            const limitedValue = numbersOnly.slice(0, 9);
            setFormData(prev => ({
                ...prev,
                [name]: limitedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // ניקוי שגיאות בזמן הקלדה
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'נא למלא שם מלא';
        }

        if (!formData.idNumber.trim()) {
            newErrors.idNumber = 'נא למלא תעודת זהות';
        } else if (!/^[0-9]{9}$/.test(formData.idNumber)) {
            newErrors.idNumber = 'תעודת זהות חייבת להכיל בדיוק 9 ספרות';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            console.log('🔄 מנסה להתחבר לשרת...', formData);

            const response = await axios.post(`${API_URL}/login`, formData);

            console.log('✅ התחברות הצליחה:', response.data);

            // שמירה ב-localStorage כדי שכל האפליקציה תדע מי המשתמש
            localStorage.setItem('currentUser', JSON.stringify(response.data));

            // רענון העמוד כדי ש-App.js יקרא את המשתמש החדש
            window.location.href = '/learning';

        } catch (err) {
            console.error('❌ שגיאה בהתחברות:', err);

            if (err.response?.data?.error) {
                setErrors({ general: err.response.data.error });
            } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                setErrors({ general: '🔌 לא ניתן להתחבר לשרת. בדוק שהשרת רץ!' });
            } else {
                setErrors({ general: 'שגיאה בהתחברות. בדוק את הפרטים ונסה שוב.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '90vh',
            backgroundColor: '#f8f9fa',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '450px'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#2c3e50', 
                    marginBottom: '30px',
                    fontSize: '2rem'
                }}>
                    🔑 כניסה למערכת
                </h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div>
                        <input 
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="שם מלא"
                            style={{ 
                                width: '100%',
                                padding: '15px', 
                                fontSize: '16px', 
                                border: errors.name ? '2px solid #e74c3c' : '2px solid #ddd', 
                                borderRadius: '8px'
                            }}
                        />
                        {errors.name && <span style={{ color: '#e74c3c', fontSize: '14px' }}>❌ {errors.name}</span>}
                    </div>

                    <div>
                        <input 
                            type="text"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleChange}
                            placeholder="תעודת זהות (9 ספרות)"
                            maxLength="9"
                            style={{ 
                                width: '100%',
                                padding: '15px', 
                                fontSize: '16px', 
                                border: errors.idNumber ? '2px solid #e74c3c' : '2px solid #ddd', 
                                borderRadius: '8px'
                            }}
                        />
                        {errors.idNumber && <span style={{ color: '#e74c3c', fontSize: '14px' }}>❌ {errors.idNumber}</span>}
                        <small style={{ color: '#7f8c8d', fontSize: '12px' }}>
                            נכתבו {formData.idNumber.length}/9 ספרות
                        </small>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{ 
                            padding: '15px', 
                            fontSize: '18px', 
                            cursor: isLoading ? 'not-allowed' : 'pointer', 
                            backgroundColor: isLoading ? '#95a5a6' : '#3498db', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px'
                        }}
                    >
                        {isLoading ? '🔄 מתחבר...' : '🚀 התחבר'}
                    </button>
                </form>

                {errors.general && (
                    <div style={{ 
                        color: '#e74c3c', 
                        marginTop: '15px', 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        backgroundColor: '#fdf2f2',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #e74c3c'
                    }}>
                        {errors.general}
                    </div>
                )}
                
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '20px',
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#3498db',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    אין לך משתמש? לחץ להרשמה
                </button>
            </div>
        </div>
    );
}

export default LoginPage;
