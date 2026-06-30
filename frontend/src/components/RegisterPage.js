import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/registerPage.css';
import { useAuth } from '../context/AuthContext';
import GenericAuthPage from './GenericAuthPage';
import { validateEmail, validateIdNumber, validatePhone } from '../utils/validation';

function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        idNumber: '',
        password: '',
        confirmPassword: ''
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

    // ולידציה של כל הטופס
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'נא למלא שם מלא';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'נא למלא מספר טלפון';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'מספר טלפון לא תקין (נייד: 0501234567, קווי: 039999999)';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'נא למלא כתובת אימייל';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה';
        }

        if (!formData.idNumber.trim()) {
            newErrors.idNumber = 'נא למלא תעודת זהות';
        } else if (!validateIdNumber(formData.idNumber)) {
            newErrors.idNumber = 'תעודת זהות לא תקינה';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'נא למלא סיסמה';
        } else if (formData.password.length < 8) {
            newErrors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'נא לאמת את הסיסמה';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');


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
        <GenericAuthPage
            title="🎓 הצטרפות לפלטפורמה"
            onSubmit={handleSubmit}
            fields={[
                {
                    name: 'name',
                    value: formData.name,
                    onChange: handleChange,
                    placeholder: 'שם מלא',
                    inputClassName: 'register-input',
                    errorClassName: 'register-error-text',
                    error: errors.name
                },
                {
                    name: 'phone',
                    type: 'tel',
                    value: formData.phone,
                    onChange: handleChange,
                    placeholder: 'מספר טלפון (050-1234567)',
                    inputClassName: 'register-input phone',
                    errorClassName: 'register-error-text',
                    error: errors.phone
                },
                {
                    name: 'idNumber',
                    value: formData.idNumber,
                    onChange: handleChange,
                    placeholder: 'תעודת זהות (9 ספרות)',
                    maxLength: '9',
                    inputClassName: 'register-input',
                    errorClassName: 'register-error-text',
                    hintClassName: 'register-hint',
                    hint: `נכתבו ${formData.idNumber.length}/9 ספרות`,
                    error: errors.idNumber
                }
            ]}
            credentials={{
                includeEmail: true,
                includePassword: true,
                includeConfirmPassword: true,
                formData,
                errors,
                onChange: handleChange,
                inputClassName: 'register-input',
                errorClassName: 'register-error-text',
                passwordWrapperClassName: 'password-field-wrapper',
                passwordAutoComplete: 'new-password',
                confirmPasswordAutoComplete: 'new-password',
                showPasswordAriaLabel: 'הצג סיסמה',
                hidePasswordAriaLabel: 'הסתר סיסמה',
                showConfirmPasswordAriaLabel: 'הצג אימות סיסמה',
                hideConfirmPasswordAriaLabel: 'הסתר אימות סיסמה'
            }}
            isLoading={isLoading}
            submitLabel="🚀 הצטרף עכשיו!"
            loadingLabel="📝 רושם אותך..."
            generalError={errors.general}
            successMessage={success}
            onSecondaryAction={() => navigate('/')}
            secondaryActionLabel="⬅️ חזרה לעמוד הבית"
            classNames={{
                page: 'register-page',
                card: 'register-card',
                title: 'register-title',
                form: 'register-form',
                submitButton: 'register-submit-button',
                generalError: 'register-general-error',
                success: 'register-success',
                secondaryButton: 'register-link-button'
            }}
        />
    );
}

export default RegisterPage;