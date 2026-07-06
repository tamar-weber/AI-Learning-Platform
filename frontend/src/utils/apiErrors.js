export function getAuthErrorMessage(error, defaultMessage) {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }

    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return '🔌 לא ניתן להתחבר לשרת. בדוק שהשרת רץ!';
    }

    return defaultMessage;
}
