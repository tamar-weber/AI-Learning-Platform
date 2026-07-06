import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import GenericAuthPage from './GenericAuthPage';
import '../styles/loginPage.css';
import useAuthForm from '../hooks/useAuthForm';
import { getAuthErrorMessage } from '../utils/apiErrors';
import { customRule, minLengthRule, requiredRule, validateWithSchema } from '../utils/validationRules';

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

    const {
        formData,
        errors,
        setErrors,
        isLoading,
        setIsLoading,
        handleChange,
        runValidation
    } = useAuthForm({
        password: '',
        confirmPassword: ''
    }, {
        validate: (data) => {
            const schema = {
                password: [
                    requiredRule('נא למלא סיסמה חדשה'),
                    minLengthRule(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
                ],
                confirmPassword: [
                    requiredRule('נא למלא אימות סיסמה'),
                    customRule((value, allData) => value !== allData.password ? 'הסיסמאות אינן תואמות' : null)
                ]
            };

            const validationErrors = validateWithSchema(schema, data);

            if (!token) {
                validationErrors.general = 'קישור האיפוס לא תקין';
            }

            return validationErrors;
        },
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
            setErrors({ general: getAuthErrorMessage(err, 'לא ניתן לאפס סיסמה. נסה שוב.') });
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
                onChange: handleFormChange,
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
