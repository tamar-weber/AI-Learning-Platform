export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validateIdNumber(idNumber) {
    const digitsOnly = String(idNumber || '').replace(/\D/g, '');

    if (!/^\d{9}$/.test(digitsOnly)) {
        return false;
    }

    // Reject obviously fake values like 000000000, 111111111, ...
    if (/^(\d)\1{8}$/.test(digitsOnly)) {
        return false;
    }

    const sum = digitsOnly
        .split('')
        .map((digit, index) => {
            const step = Number(digit) * ((index % 2) + 1);
            return step > 9 ? step - 9 : step;
        })
        .reduce((acc, value) => acc + value, 0);

    return sum % 10 === 0;
}

export function validatePhone(phone) {
    const digitsOnly = String(phone || '').replace(/\D/g, '');

    // Israeli mobile: 05X + 7 digits = 10 digits total.
    const mobilePattern = /^05\d{8}$/;

    // Israeli landline: area code 02/03/04/08/09 + 7 digits = 9 digits total.
    const landlinePattern = /^0[23489]\d{7}$/;

    return mobilePattern.test(digitsOnly) || landlinePattern.test(digitsOnly);
}