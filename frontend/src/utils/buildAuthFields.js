function buildCredentialFields(credentials) {
    if (!credentials) {
        return [];
    }

    return [
        ...(credentials.includeEmail ? [{
            name: 'email',
            type: 'email',
            value: credentials.formData.email,
            onChange: credentials.onChange,
            placeholder: credentials.emailPlaceholder || 'כתובת אימייל',
            autoComplete: credentials.emailAutoComplete || 'email',
            inputClassName: credentials.inputClassName,
            errorClassName: credentials.errorClassName,
            error: credentials.errors.email,
            isPasswordField: false
        }] : []),
        ...(credentials.includePassword ? [{
            name: 'password',
            value: credentials.formData.password,
            onChange: credentials.onChange,
            placeholder: credentials.passwordPlaceholder || 'סיסמה',
            autoComplete: credentials.passwordAutoComplete || 'current-password',
            inputClassName: credentials.inputClassName,
            errorClassName: credentials.errorClassName,
            wrapperClassName: credentials.passwordWrapperClassName || 'password-field-wrapper',
            error: credentials.errors.password,
            showAriaLabel: credentials.showPasswordAriaLabel || 'הצג סיסמה',
            hideAriaLabel: credentials.hidePasswordAriaLabel || 'הסתר סיסמה',
            isPasswordField: true
        }] : []),
        ...(credentials.includeConfirmPassword ? [{
            name: 'confirmPassword',
            value: credentials.formData.confirmPassword,
            onChange: credentials.onChange,
            placeholder: credentials.confirmPasswordPlaceholder || 'אימות סיסמה',
            autoComplete: credentials.confirmPasswordAutoComplete || 'new-password',
            inputClassName: credentials.inputClassName,
            errorClassName: credentials.errorClassName,
            wrapperClassName: credentials.passwordWrapperClassName || 'password-field-wrapper',
            error: credentials.errors.confirmPassword,
            showAriaLabel: credentials.showConfirmPasswordAriaLabel || 'הצג אימות סיסמה',
            hideAriaLabel: credentials.hideConfirmPasswordAriaLabel || 'הסתר אימות סיסמה',
            isPasswordField: true
        }] : [])
    ];
}

export default buildCredentialFields;
