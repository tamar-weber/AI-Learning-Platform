import { validateEmail } from './validation';

export function validateUpdateDetailsForm(profileForm) {
    const errors = {};

    if (!profileForm.name.trim()) {
        errors.name = 'נא למלא שם מלא';
    }

    if (!profileForm.phone.trim()) {
        errors.phone = 'נא למלא מספר טלפון';
    }

    if (!profileForm.email.trim()) {
        errors.email = 'נא למלא כתובת אימייל';
    } else if (!validateEmail(profileForm.email.trim())) {
        errors.email = 'כתובת אימייל לא תקינה';
    }

    return errors;
}
