import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const API_URL = 'http://localhost:8000/api';

function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        idNumber: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // פונקציה שמנקה שגיאות כשמתחילים לכתוב
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // עבור תעודת זהות - לאפשר רק ספרות
        if (name === 'idNumber') {
            // הסרת כל מה שלא ספרה
            const numbersOnly = value.replace(/[^0-9]/g, '');
            // מקסימום 9 ספרות
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

        // ניקוי שגיאה של השדה הספציפי כשמתחילים לכתוב
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // פונקציות ולידציה
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateIdNumber = (idNumber) => {
        // בדיקה שזה בדיוק 9 ספרות
        return /^[0-9]{9}$/.test(idNumber);
    };

    const validatePhone = (phone) => {
        // בדיקה בסיסית לטלפון ישראלי
        const phoneRegex = /^05[0-9]-?[0-9]{7}$/;
        return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
    };

    // ולידציה של כל הטופס
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'נא למלא שם מלא';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'נא למלא מספר טלפון';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'מספר טלפון לא תקין (דוגמה: 050-1234567)';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'נא למלא כתובת אימייל';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה';
        }

        if (!formData.idNumber.trim()) {
            newErrors.idNumber = 'נא למלא תעודת זהות';
        } else if (!validateIdNumber(formData.idNumber)) {
            newErrors.idNumber = 'תעודת זהות חייבת להכיל בדיוק 9 ספרות';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');

        // בדיקת ולידציה
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            console.log('🔄 מנסה לשלוח בקשה לשרת...', formData);
            
            const response = await axios.post(`${API_URL}/register`, formData);
            
            console.log('✅ הרשמה הצליחה:', response.data);
            setSuccess(`שלום ${response.data.name}! נרשמת בהצלחה למערכת!`);
            
            // שמירת פרטי המשתמש ב-localStorage
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            
            // מעבר לעמוד הלמידה אחרי 2 שניות
            setTimeout(() => {
                window.location.href = '/learning';
            }, 2000);

        } catch (err) {
            console.error('❌ שגיאה ברישום:', err);
            
            if (err.response?.data?.error) {
                setErrors({ general: err.response.data.error });
            } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                setErrors({ general: '🔌 לא ניתן להתחבר לשרת. בדוק שהשרת רץ!' });
            } else {
                setErrors({ general: 'אופס, לא הצלחנו לרשום אותך. נסה שוב.' });
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
            padding: '20px',
            direction: 'rtl'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '500px'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#2c3e50', 
                    marginBottom: '30px',
                    fontSize: '2rem'
                }}>
                    🎓 הצטרפות לפלטפורמה
                </h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* שם מלא */}
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

                    {/* טלפון */}
                    <div>
                        <input 
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="מספר טלפון (050-1234567)"
                            style={{ 
                                width: '100%',
                                padding: '15px', 
                                fontSize: '16px', 
                                border: errors.phone ? '2px solid #e74c3c' : '2px solid #ddd', 
                                borderRadius: '8px',
                                direction: 'rtl'
                            }}
                        />
                        {errors.phone && <span style={{ color: '#e74c3c', fontSize: '14px' }}>❌ {errors.phone}</span>}
                    </div>

                    {/* אימייל */}
                    <div>
                        <input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="כתובת אימייל"
                            style={{ 
                                width: '100%',
                                padding: '15px', 
                                fontSize: '16px', 
                                border: errors.email ? '2px solid #e74c3c' : '2px solid #ddd', 
                                borderRadius: '8px'
                            }}
                        />
                        {errors.email && <span style={{ color: '#e74c3c', fontSize: '14px' }}>❌ {errors.email}</span>}
                    </div>

                    {/* תעודת זהות */}
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
                            backgroundColor: isLoading ? '#95a5a6' : '#27ae60', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px'
                        }}
                    >
                        {isLoading ? '📝 רושם אותך...' : '🚀 הצטרף עכשיו!'}
                    </button>
                </form>

                {/* הודעות שגיאה כלליות */}
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

                {/* הודעת הצלחה */}
                {success && (
                    <div style={{ 
                        color: '#27ae60', 
                        marginTop: '15px', 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        backgroundColor: '#f2fdf5',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #27ae60'
                    }}>
                        ✅ {success}
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
                      ⬅️ חזרה לעמוד הבית
                </button>
            </div>
        </div>
    );
}

export default RegisterPage;