import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/loginPage.css';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
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

            const response = await api.post('/login', formData);

            console.log('✅ התחברות הצליחה:', response.data);

            // שמירה ב-localStorage כדי שכל האפליקציה תדע מי המשתמש
            login(response.data);

            navigate('/learning', { replace: true });

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
        <div className="login-page">
            <div className="login-card">
                <h2 className="login-title">🔑 כניסה למערכת</h2>

                <form onSubmit={handleSubmit} className="login-form">
                    <div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="שם מלא"
                            className={`login-input ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && <span className="login-error-text">❌ {errors.name}</span>}
                    </div>

                    <div>
                        <input
                            type="text"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleChange}
                            placeholder="תעודת זהות (9 ספרות)"
                            maxLength="9"
                            className={`login-input ${errors.idNumber ? 'error' : ''}`}
                        />
                        {errors.idNumber && <span className="login-error-text">❌ {errors.idNumber}</span>}
                        <small className="login-hint">
                            נכתבו {formData.idNumber.length}/9 ספרות
                        </small>
                    </div>

                    <button type="submit" disabled={isLoading} className="login-submit-button">
                        {isLoading ? '🔄 מתחבר...' : '🚀 התחבר'}
                    </button>
                </form>

                {errors.general && <div className="login-general-error">{errors.general}</div>}

                <button onClick={() => navigate('/')} className="login-link-button">
                    אין לך משתמש? לחץ להרשמה
                </button>
            </div>
        </div>
    );
}

export default LoginPage;
