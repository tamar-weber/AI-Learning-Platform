import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/loginPage.css';
import { useAuth } from '../context/AuthContext';
import GenericAuthPage from './GenericAuthPage';
import { validateEmail } from '../utils/validation';

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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

        if (!formData.email.trim()) {
            newErrors.email = 'נא למלא כתובת אימייל';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'נא למלא סיסמה';
        } else if (formData.password.length < 8) {
            newErrors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים';
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
            console.log('🔄 מנסה להתחבר לשרת...', { email: formData.email });

            const response = await api.post('/login', formData);

            console.log('✅ התחברות הצליחה:', response.data);

           
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
        <GenericAuthPage
            title="🔑 כניסה למערכת"
            onSubmit={handleSubmit}
            fields={[]}
            credentials={{
                includeEmail: true,
                includePassword: true,
                formData,
                errors,
                onChange: handleChange,
                inputClassName: 'login-input',
                errorClassName: 'login-error-text',
                passwordWrapperClassName: 'password-field-wrapper',
                showPasswordAriaLabel: 'הצג סיסמה',
                hidePasswordAriaLabel: 'הסתר סיסמה'
            }}
            isLoading={isLoading}
            submitLabel="🚀 התחבר"
            loadingLabel="🔄 מתחבר..."
            generalError={errors.general}
            onSecondaryAction={() => navigate('/')}
            secondaryActionLabel="אין לך משתמש? לחץ להרשמה"
            onTertiaryAction={() => navigate('/forgot-password')}
            tertiaryActionLabel="שכחת סיסמה?"
            tertiaryActionClassName="forgot-password-button"
            classNames={{
                page: 'login-page',
                card: 'login-card',
                title: 'login-title',
                form: 'login-form',
                submitButton: 'login-submit-button',
                generalError: 'login-general-error',
                secondaryButton: 'login-link-button'
            }}
        />
    );
}

export default LoginPage;
