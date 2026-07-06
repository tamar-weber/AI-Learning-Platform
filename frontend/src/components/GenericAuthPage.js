import React, { useState } from 'react';
import eyeIcon from '../Icon/eye-solid-full.svg';
import eyeSlashIcon from '../Icon/eye-slash-solid-full.svg';
import buildCredentialFields from '../utils/buildAuthFields';

function GenericAuthPage({
    title,
    onSubmit,
    fields,
    passwordFields = [],
    credentials,
    isLoading,
    submitLabel,
    loadingLabel,
    generalError,
    successMessage,
    onSecondaryAction,
    secondaryActionLabel,
    onTertiaryAction,
    tertiaryActionLabel,
    tertiaryActionClassName,
    classNames
}) {
    const [passwordVisibility, setPasswordVisibility] = useState({});

    const togglePasswordVisibility = (fieldName) => {
        setPasswordVisibility((prev) => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    const allFields = [
        ...fields.map((field) => ({ ...field, isPasswordField: false })),
        ...buildCredentialFields(credentials),
        ...passwordFields.map((field) => ({
            ...field,
            isPasswordField: true,
            wrapperClassName: field.wrapperClassName || 'password-field-wrapper'
        }))
    ];

    return (
        <div className={classNames.page}>
            <div className={classNames.card}>
                <h2 className={classNames.title}>{title}</h2>

                <form onSubmit={onSubmit} className={classNames.form}>
                    {allFields.map((field) => {
                        const isPasswordField = Boolean(field.isPasswordField);
                        const isVisible = Boolean(passwordVisibility[field.name]);
                        const resolvedType = isPasswordField
                            ? (isVisible ? 'text' : 'password')
                            : (field.type || 'text');

                        return (
                            <div key={field.name} className={field.wrapperClassName}>
                                <input
                                    type={resolvedType}
                                    name={field.name}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={field.placeholder}
                                    autoComplete={field.autoComplete}
                                    maxLength={field.maxLength}
                                    className={`${field.inputClassName} ${field.error ? 'error' : ''}`}
                                />

                                {isPasswordField && (
                                    <button
                                        type="button"
                                        className="password-toggle-button"
                                        onClick={() => togglePasswordVisibility(field.name)}
                                        aria-label={isVisible ? field.hideAriaLabel : field.showAriaLabel}
                                    >
                                        <img
                                            src={isVisible ? eyeSlashIcon : eyeIcon}
                                            alt={isVisible ? field.hideAriaLabel : field.showAriaLabel}
                                            className="password-toggle-icon"
                                        />
                                    </button>
                                )}

                                {field.error && <span className={field.errorClassName}>❌ {field.error}</span>}
                                {field.hint && <small className={field.hintClassName}>{field.hint}</small>}
                            </div>
                        );
                    })}

                    <button type="submit" disabled={isLoading} className={classNames.submitButton}>
                        {isLoading ? loadingLabel : submitLabel}
                    </button>
                </form>

                {generalError && <div className={classNames.generalError}>{generalError}</div>}
                {successMessage && <div className={classNames.success}>✅ {successMessage}</div>}

                <button onClick={onSecondaryAction} className={classNames.secondaryButton}>
                    {secondaryActionLabel}
                </button>

                {onTertiaryAction && tertiaryActionLabel && (
                    <button
                        type="button"
                        onClick={onTertiaryAction}
                        className={tertiaryActionClassName || 'login-link-button'}
                    >
                        {tertiaryActionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

export default GenericAuthPage;