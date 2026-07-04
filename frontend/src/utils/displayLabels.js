const PURCHASE_STATUS_LABELS = {
    paid: 'שולם',
    succeeded: 'שולם',
    pending: 'ממתין לתשלום',
    processing: 'בעיבוד',
    failed: 'נכשל',
    canceled: 'בוטל',
    cancelled: 'בוטל',
    refunded: 'הוחזר',
    unpaid: 'לא שולם'
};

const PAYMENT_METHOD_LABELS = {
    card: 'כרטיס אשראי',
    cash: 'מזומן',
    bank_transfer: 'העברה בנקאית',
    paypal: 'פייפאל',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    stripe: 'כרטיס אשראי',
    unknown: 'לא ידוע'
};

const ACTIVITY_TYPE_LABELS = {
    login: 'התחברות',
    enrollment: 'הרשמה לקורס',
    purchase: 'רכישה',
    course_completion: 'סיום קורס',
    profile_update: 'עדכון פרופיל',
    password_change: 'שינוי סיסמה',
    notification: 'התראה'
};

function normalizeEnumValue(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
}

function containsHebrewText(value) {
    return /[\u0590-\u05FF]/.test(value);
}

function formatByDictionary(value, dictionary, fallback = 'לא ידוע') {
    const normalizedValue = normalizeEnumValue(value);

    if (!normalizedValue) {
        return '-';
    }

    const key = normalizedValue.toLowerCase();

    if (dictionary[key]) {
        return dictionary[key];
    }

    if (containsHebrewText(normalizedValue)) {
        return normalizedValue;
    }

    return fallback;
}

export function formatPurchaseStatus(value) {
    return formatByDictionary(value, PURCHASE_STATUS_LABELS);
}

export function formatPaymentMethod(value) {
    return formatByDictionary(value, PAYMENT_METHOD_LABELS);
}

export function formatActivityType(value) {
    return formatByDictionary(value, ACTIVITY_TYPE_LABELS, 'פעילות');
}
