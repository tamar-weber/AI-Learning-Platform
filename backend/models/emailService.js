const nodemailer = require('nodemailer');

function createTransporter() {
    const { EMAIL_USER, EMAIL_PASS } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error('Missing SMTP configuration: EMAIL_USER or EMAIL_PASS');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });
}

async function sendWelcomeEmail({ to, name }) {
    if (!to || !name) {
        throw new Error('Missing required fields for welcome email');
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'נרשמת בהצלחה לפלטפורמה',
        text: `שלום ${name}, ברוכים הבאים לפלטפורמה! שמחים שהצטרפת. ניתן להתחבר, לצפות בקורסים ולהירשם. צוות הפלטפורמה`
    });
}

async function sendCourseUpdateEmail({ to, recipientName, course }) {
    if (!to || !course) {
        throw new Error('Missing required fields for course update email');
    }

    const transporter = createTransporter();
    const safeName = recipientName || 'משתמש יקר';

    const html = `
        <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;direction:rtl;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #dbe5ef;overflow:hidden;">
                            <tr>
                                <td style="background:#2f6ea5;color:#ffffff;padding:16px 20px;font-size:20px;font-weight:700;">עדכון לקורס שנרשמת אליו</td>
                            </tr>
                            <tr>
                                <td style="padding:20px;color:#1f2937;font-size:15px;line-height:1.7;">
                                    <p style="margin:0 0 12px;">שלום ${safeName},</p>
                                    <p style="margin:0 0 18px;">יש עדכון חדש בקורס שלך:</p>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                                        <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;border-bottom:1px solid #e5e7eb;">שם הקורס</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${course.courseName}</td></tr>
                                        <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;border-bottom:1px solid #e5e7eb;">תיאור</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${course.courseDescription || '-'}</td></tr>
                                        <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;border-bottom:1px solid #e5e7eb;">קטגוריה</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${course.category || '-'}</td></tr>
                                        <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;border-bottom:1px solid #e5e7eb;">מספר שיעורים</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${course.lessonsCount ?? '-'}</td></tr>
                                        <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:700;">מחיר</td><td style="padding:10px 12px;">₪${Number(course.coursePrice || 0).toLocaleString('he-IL')}</td></tr>
                                    </table>
                                    <p style="margin:18px 0 0;">צוות הפלטפורמה</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: `עדכון חשוב בקורס: ${course.courseName}`,
        html
    });
}

async function sendEnrollmentConfirmationEmail({ to, userName, courseName, courseLink }) {
    if (!to || !userName || !courseName || !courseLink) {
        throw new Error('Missing required fields for enrollment confirmation email');
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'ההרשמה לקורס בוצעה בהצלחה',
        text: `שלום ${userName}, ההרשמה שלך לקורס "${courseName}" הושלמה בהצלחה. ניתן לגשת לקורס בקישור: ${courseLink}`
    });
}

async function sendPasswordResetEmail({ to, resetLink }) {
    if (!to || !resetLink) {
        throw new Error('Missing required fields for password reset email');
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'איפוס סיסמה',
        text: `בקשת איפוס סיסמה התקבלה. לאיפוס הסיסמה לחצו על הקישור: ${resetLink}. הקישור בתוקף לשעה אחת בלבד.`
    });
}

async function sendAdminCampaignEmail({ to, subject, body }) {
    if (!to || !subject || !body) {
        throw new Error('Missing required fields for admin campaign email');
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: body
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCourseUpdateEmail,
    sendEnrollmentConfirmationEmail,
    sendPasswordResetEmail,
    sendAdminCampaignEmail
};