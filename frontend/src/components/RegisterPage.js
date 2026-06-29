import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/registerPage.css';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
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
            
            const response = await api.post('/register', formData);
            
            console.log('✅ הרשמה הצליחה:', response.data);
            setSuccess(`שלום ${response.data.name}! נרשמת בהצלחה למערכת!`);
            
            // שמירת פרטי המשתמש ב-localStorage
            login(response.data);
            
            // מעבר לעמוד הלמידה אחרי 2 שניות
            setTimeout(() => {
                navigate('/learning', { replace: true });
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
        <div className="register-page">
            <div className="register-card">
                <h2 className="register-title">🎓 הצטרפות לפלטפורמה</h2>

                <form onSubmit={handleSubmit} className="register-form">
                    <div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="שם מלא"
                            className={`register-input ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && <span className="register-error-text">❌ {errors.name}</span>}
                    </div>

                    <div>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="מספר טלפון (050-1234567)"
                            className={`register-input phone ${errors.phone ? 'error' : ''}`}
                        />
                        {errors.phone && <span className="register-error-text">❌ {errors.phone}</span>}
                    </div>

                    <div>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="כתובת אימייל"
                            className={`register-input ${errors.email ? 'error' : ''}`}
                        />
                        {errors.email && <span className="register-error-text">❌ {errors.email}</span>}
                    </div>

                    <div>
                        <input
                            type="text"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleChange}
                            placeholder="תעודת זהות (9 ספרות)"
                            maxLength="9"
                            className={`register-input ${errors.idNumber ? 'error' : ''}`}
                        />
                        {errors.idNumber && <span className="register-error-text">❌ {errors.idNumber}</span>}
                        <small className="register-hint">נכתבו {formData.idNumber.length}/9 ספרות</small>
                    </div>

                    <button type="submit" disabled={isLoading} className="register-submit-button">
                        {isLoading ? '📝 רושם אותך...' : '🚀 הצטרף עכשיו!'}
                    </button>
                </form>

                {errors.general && <div className="register-general-error">{errors.general}</div>}
                {success && <div className="register-success">✅ {success}</div>}

                <button onClick={() => navigate('/')} className="register-link-button">
                    ⬅️ חזרה לעמוד הבית
                </button>
            </div>
        </div>
    );
}

export default RegisterPage;