import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/registerPage.css';
import { useAuth } from '../context/AuthContext';
import GenericAuthPage from './GenericAuthPage';
import { validateEmail, validateIdNumber, validatePhone } from '../utils/validation';
import useAuthForm from '../hooks/useAuthForm';
import { getAuthErrorMessage } from '../utils/apiErrors';
import { customRule, minLengthRule, patternRule, requiredRule, validateWithSchema } from '../utils/validationRules';

const digitsOnlyFormatter = (value) => value.replace(/[^0-9]/g, '').slice(0, 9);

const registerValidationSchema = {
    name: [requiredRule('נא למלא שם מלא')],
    phone: [
        requiredRule('נא למלא מספר טלפון'),
        patternRule(validatePhone, 'מספר טלפון לא תקין (נייד: 0501234567, קווי: 039999999)')
    ],
    email: [
        requiredRule('נא למלא כתובת אימייל'),
        patternRule(validateEmail, 'כתובת אימייל לא תקינה')
    ],
    idNumber: [
        requiredRule('נא למלא תעודת זהות'),
        patternRule(validateIdNumber, 'תעודת זהות לא תקינה')
    ],
    password: [
        requiredRule('נא למלא סיסמה'),
        minLengthRule(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
    ],
    confirmPassword: [
        requiredRule('נא לאמת את הסיסמה'),
        customRule((value, data) => value !== data.password ? 'הסיסמאות אינן תואמות' : null)
    ]
};

function RegisterPage() {
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
        name: '',
        phone: '',
        email: '',
        idNumber: '',
        password: '',
        confirmPassword: ''
    }, {
        validate: (data) => validateWithSchema(registerValidationSchema, data),
        formatters: {
            idNumber: digitsOnlyFormatter
        }
    });
    const [success, setSuccess] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccess('');

        if (!runValidation()) {
            return;
        }

        setIsLoading(true);

        try {
            
            const response = await api.post('/register', formData);
            setSuccess(`שלום ${response.data.name}! נרשמת בהצלחה למערכת!`);
            
            // שמירת פרטי המשתמש ב-localStorage
            login(response.data);
            
            // מעבר לעמוד הלמידה אחרי 2 שניות
            setTimeout(() => {
                navigate('/learning', { replace: true });
            }, 2000);

        } catch (err) {

            setErrors({ general: getAuthErrorMessage(err, 'אופס, לא הצלחנו לרשום אותך. נסה שוב.') });
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