import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import GenericAuthPage from './GenericAuthPage';
import '../styles/loginPage.css';

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
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

        if (!token) {
            newErrors.general = 'קישור האיפוס לא תקין';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'נא למלא סיסמה חדשה';
        } else if (formData.password.length < 8) {
            newErrors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'נא למלא אימות סיסמה';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
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
            await api.post('/reset-password', {
                token,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });

            setSuccessMessage('הסיסמה אופסה בהצלחה. מועבר למסך הכניסה...');

            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1200);
        } catch (err) {
            setErrors({
                general: err.response?.data?.error || 'לא ניתן לאפס סיסמה. נסה שוב.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GenericAuthPage
            title="איפוס סיסמה"
            onSubmit={handleSubmit}
            fields={[]}
            credentials={{
                includeEmail: false,
                includePassword: true,
                includeConfirmPassword: true,
                formData,
                errors,
                onChange: handleChange,
                inputClassName: 'login-input',
                errorClassName: 'login-error-text',
                passwordWrapperClassName: 'password-field-wrapper',
                passwordPlaceholder: 'סיסמה חדשה',
                confirmPasswordPlaceholder: 'אימות סיסמה חדשה'
            }}
            isLoading={isLoading}
            submitLabel="אפס סיסמה"
            loadingLabel="מאפס..."
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

export default ResetPasswordPage;
