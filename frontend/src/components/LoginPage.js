import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/loginPage.css';
import { useAuth } from '../context/AuthContext';
import GenericAuthPage from './GenericAuthPage';
import { validateEmail } from '../utils/validation';
import useAuthForm from '../hooks/useAuthForm';
import { getAuthErrorMessage } from '../utils/apiErrors';
import { minLengthRule, patternRule, requiredRule, validateWithSchema } from '../utils/validationRules';

const loginValidationSchema = {
    email: [
        requiredRule('נא למלא כתובת אימייל'),
        patternRule(validateEmail, 'כתובת אימייל לא תקינה')
    ],
    password: [
        requiredRule('נא למלא סיסמה'),
        minLengthRule(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
    ]
};

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const {
        formData,
        errors,
        setErrors,
        isLoading,
        setIsLoading,
        handleChange,
        runValidation
    } = useAuthForm({
        email: '',
        password: ''
    }, {
        validate: (data) => validateWithSchema(loginValidationSchema, data)
    });

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!runValidation()) {
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
            setErrors({ general: getAuthErrorMessage(err, 'שגיאה בהתחברות. בדוק את הפרטים ונסה שוב.') });
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
