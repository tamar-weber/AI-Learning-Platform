import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import GenericAuthPage from './GenericAuthPage';
import '../styles/loginPage.css';
import { validateEmail } from '../utils/validation';

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (errors[name] || errors.general) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
                general: ''
            }));
        }

        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'נא למלא כתובת אימייל';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה';
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
            const response = await api.post('/forgot-password', {
                email: formData.email.trim()
            });

            setSuccessMessage(response?.data?.message || 'אם האימייל קיים במערכת, נשלח קישור לאיפוס סיסמה.');
        } catch (err) {
            setErrors({
                general: err.response?.data?.error || 'אירעה שגיאה בשליחת בקשת האיפוס. נסה שוב.'
            });
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
                onChange: handleChange,
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
