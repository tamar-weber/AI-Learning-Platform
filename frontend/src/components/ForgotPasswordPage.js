import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import GenericAuthPage from './GenericAuthPage';
import '../styles/loginPage.css';
import { validateEmail } from '../utils/validation';
import useAuthForm from '../hooks/useAuthForm';
import { getAuthErrorMessage } from '../utils/apiErrors';
import { patternRule, requiredRule, validateWithSchema } from '../utils/validationRules';

const forgotPasswordValidationSchema = {
    email: [
        requiredRule('נא למלא כתובת אימייל'),
        patternRule(validateEmail, 'כתובת אימייל לא תקינה')
    ]
};

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const {
        formData,
        errors,
        setErrors,
        isLoading,
        setIsLoading,
        handleChange,
        runValidation
    } = useAuthForm({ email: '' }, {
        validate: (data) => validateWithSchema(forgotPasswordValidationSchema, data),
        clearGeneralErrorOnChange: true
    });
    const [successMessage, setSuccessMessage] = useState('');

    const handleFormChange = (event) => {
        handleChange(event);
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!runValidation()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/forgot-password', {
                email: formData.email.trim()
            });

            setSuccessMessage(response?.data?.message || 'אם האימייל קיים במערכת, נשלח קישור לאיפוס סיסמה.');
        } catch (err) {
            setErrors({ general: getAuthErrorMessage(err, 'אירעה שגיאה בשליחת בקשת האיפוס. נסה שוב.') });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GenericAuthPage
            title="שחזור סיסמה"
            onSubmit={handleSubmit}
            fields={[]}
            credentials={{
                includeEmail: true,
                includePassword: false,
                formData,
                errors,
                onChange: handleFormChange,
                inputClassName: 'login-input',
                errorClassName: 'login-error-text'
            }}
            isLoading={isLoading}
            submitLabel="שלח קישור איפוס"
            loadingLabel="שולח..."
            generalError={errors.general}
            successMessage={successMessage}
            onSecondaryAction={() => navigate('/login')}
            secondaryActionLabel="חזרה לכניסה"
            classNames={{
                page: 'login-page',
                card: 'login-card',
                title: 'login-title',
                form: 'login-form',
                submitButton: 'login-submit-button',
                generalError: 'login-general-error',
                success: 'register-success',
                secondaryButton: 'login-link-button'
            }}
        />
    );
}

export default ForgotPasswordPage;
