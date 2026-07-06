const crypto = require('crypto');
const OpenAI = require('openai');
const RagDocument = require('../middleware/RagDocument');
const Course = require('../middleware/Course');
const { categories, subCategories } = require('./categoryService');
const RagQueryLog = require('../middleware/RagQueryLog');
const User = require('../middleware/User');
const purchaseService = require('./purchaseService');
const userActivityService = require('./userActivityService');
const notificationService = require('./notificationService');
const historyService = require('./historyService');
const courseService = require('./courseService');
const AppError = require('../utils/appError');

let openaiClient = null;

const DEFAULT_MODEL = process.env.OPENAI_RAG_MODEL || 'gpt-4o-mini';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = Number(process.env.RAG_SIMILARITY_THRESHOLD || 0.42);
const RATE_LIMIT_MAX = Number(process.env.RAG_RATE_LIMIT_MAX || 60);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RAG_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const requestCounters = new Map();

const STATIC_DOCS = [
    {
        sourceType: 'site',
        sourceId: 'home-page',
        title: 'דף הבית',
        content: 'פלטפורמת למידה חכמה ללמידה בעזרת בינה מלאכותית. המשתמש יכול להירשם, להתחבר, לצפות בקורסים ולהשתמש במערכת ליצירת שיעורים מותאמים אישית.'
    },
    {
        sourceType: 'site',
        sourceId: 'learning-page',
        title: 'עמוד יצירת שיעור',
        content: 'בעמוד הלמידה המשתמש בוחר קטגוריה, תת-קטגוריה, ומזין שאלה או נושא. לאחר מכן המערכת יוצרת שיעור מותאם אישית בעזרת AI.'
    },
    {
        sourceType: 'site',
        sourceId: 'support-info',
        title: 'מידע מערכת',
        content: 'המערכת כוללת הרשמה, כניסה, איפוס סיסמה, ניהול קורסים, היסטוריית פעילות, התראות, רכישות ודשבורד אדמיני.'
    },
    {
        sourceType: 'site',
        sourceId: 'rag-help',
        title: 'עזרה וחיפוש מידע',
        content: 'העוזר החכם עונה על סמך הקורסים, הקטגוריות, תתי-הקטגוריות ומידע האתר. אם המשתמש שואל על תמיכה, הוא יכול לקבל תשובה מפורטת מהמקורות הקיימים במערכת.'
    },
    {
        sourceType: 'site',
        sourceId: 'registration-page',
        title: 'עמוד הרשמה',
        content: 'עמוד ההרשמה נמצא בנתיב /register. אפשר להגיע אליו מכפתור ההרשמה בעמוד הבית או מהניווט הראשי.'
    },
    {
        sourceType: 'site',
        sourceId: 'history-page',
        title: 'עמוד היסטוריה',
        content: 'עמוד ההיסטוריה נמצא בנתיב /history. משתמש רגיל רואה את ההיסטוריה האישית שלו, ומנהל יכול לראות היסטוריה של משתמש אחר דרך /history/:userId.'
    },
    {
        sourceType: 'site',
        sourceId: 'admin-pages',
        title: 'עמודי מנהל',
        content: 'למנהל יש אזורים ב-/admin, ב-/admin/dashboard וב-/admin/messages. שם אפשר לראות משתמשים, דשבורד, הודעות ונתוני מערכת.'
    }
];

function getOpenAIClient() {
    if (!openaiClient && typeof process.env.OPENAI_API_KEY === 'string' && process.env.OPENAI_API_KEY.trim().startsWith('sk-')) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    return openaiClient;
}

function normalizeText(text) {
    return typeof text === 'string' ? text.trim().replace(/\s+/g, ' ') : '';
}

function buildDocumentId(sourceType, sourceId) {
    return crypto.createHash('sha1').update(`${sourceType}:${sourceId}`).digest('hex');
}

function formatDateForRag(value) {
    if (!value) {
        return 'לא זמין';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'לא זמין';
    }

    return date.toLocaleDateString('he-IL');
}

function buildCourseDocumentContent(course) {
    const description = normalizeText(course.courseDescription) || 'אין תיאור זמין';
    const title = normalizeText(course.courseName) || 'ללא שם';
    const category = normalizeText(course.category) || 'לא סווג';
    const lecturer = normalizeText(course.lecturerName) || 'לא צוין';
    const lessonsCount = Number.isFinite(Number(course.lessonsCount)) ? Number(course.lessonsCount) : 'לא זמין';
    const price = Number.isFinite(Number(course.coursePrice)) ? Number(course.coursePrice) : 'לא זמין';
    const enrollmentStatus = normalizeText(course.enrollmentStatus) || 'לא ידוע';
    const currentEnrollment = Number.isFinite(Number(course.currentEnrollment)) ? Number(course.currentEnrollment) : 'לא זמין';
    const startDate = formatDateForRag(course.courseStartDate);
    const closeDate = formatDateForRag(course.enrollmentCloseDate);

    return [
        `שם הקורס: ${title}`,
        `מרצה: ${lecturer}`,
        `קטגוריה: ${category}`,
        `תיאור: ${description}`,
        `מספר שיעורים: ${lessonsCount}`,
        `מספר נרשמים נוכחי: ${currentEnrollment}`,
        `תאריך פתיחת הקורס: ${startDate}`,
        `תאריך סגירת הרשמה: ${closeDate}`,
        `מחיר: ${price}`,
        `סטטוס הרשמה: ${enrollmentStatus}`,
        `מילות מפתח: ${[title, category, lecturer, description].join(' ')}`
    ].join('\n');
}

async function getEmbedding(text) {
    const client = getOpenAIClient();

    if (!client) {
        throw new AppError('OpenAI API key is missing for embeddings', 503);
    }

    const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text
    });

    const embedding = response?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new AppError('לא התקבל embedding תקין', 502);
    }

    return embedding;
}

async function upsertDocument({ sourceType, sourceId, title, content, metadata = {} }) {
    const normalizedTitle = normalizeText(title);
    const normalizedContent = normalizeText(content);

    if (!normalizedTitle || !normalizedContent) {
        throw new AppError('חסרים נתונים למסמך RAG', 400);
    }

    const embedding = await getEmbedding(`${normalizedTitle}\n\n${normalizedContent}`);
    const updatedAt = new Date();

    await RagDocument.findOneAndUpdate(
        { sourceType, sourceId },
        {
            $set: {
                sourceType,
                sourceId,
                title: normalizedTitle,
                content: normalizedContent,
                metadata,
                embedding,
                updatedAt
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { id: buildDocumentId(sourceType, sourceId), sourceType, sourceId, title: normalizedTitle };
}

async function removeDocumentBySource(sourceType, sourceId) {
    await RagDocument.deleteOne({ sourceType, sourceId });
}

async function seedStaticDocuments() {
    await Promise.allSettled(
        STATIC_DOCS.map((doc) => upsertDocument({
            sourceType: doc.sourceType,
            sourceId: doc.sourceId,
            title: doc.title,
            content: doc.content,
            metadata: { category: 'site' }
        }))
    );
}

async function seedCatalogDocuments() {
    const categoryDocs = categories.map((category) => ({
        sourceType: 'category',
        sourceId: `category-${category.id}`,
        title: `קטגוריה: ${category.name}`,
        content: `הקטגוריה ${category.name} כוללת תכנים ומסלולי למידה הקשורים לנושא זה.`
    }));

    const subCategoryDocs = subCategories.map((subCategory) => ({
        sourceType: 'subcategory',
        sourceId: `subcategory-${subCategory.id}`,
        title: `תת-קטגוריה: ${subCategory.name}`,
        content: `תת-הקטגוריה ${subCategory.name} שייכת לקטגוריית האב מספר ${subCategory.category_id}.`
    }));

    await Promise.allSettled([
        ...categoryDocs.map((doc) => upsertDocument(doc)),
        ...subCategoryDocs.map((doc) => upsertDocument(doc))
    ]);
}

async function seedCourseCatalog() {
    const courses = await Course.find().lean();

    await Promise.allSettled(courses.map((course) => syncCourse(course._id)));
}

async function syncCategories() {
    const operations = [];

    categories.forEach((category) => {
        operations.push(upsertDocument({
            sourceType: 'category',
            sourceId: `category-${category.id}`,
            title: `קטגוריה: ${category.name}`,
            content: `קטגוריית לימוד: ${category.name}.`
        }));
    });

    subCategories.forEach((subCategory) => {
        operations.push(upsertDocument({
            sourceType: 'subcategory',
            sourceId: `subcategory-${subCategory.id}`,
            title: `תת-קטגוריה: ${subCategory.name}`,
            content: `תת-קטגוריית לימוד: ${subCategory.name}. קטגוריית אב מספר ${subCategory.category_id}.`
        }));
    });

    await Promise.allSettled(operations);
}

async function syncCourse(courseId) {
    const course = await Course.findById(courseId).lean();

    if (!course) {
        await removeDocumentBySource('course', String(courseId));
        return null;
    }

    return upsertDocument({
        sourceType: 'course',
        sourceId: String(course._id),
        title: course.courseName,
        content: buildCourseDocumentContent(course),
        metadata: {
            coursePrice: course.coursePrice,
            category: course.category,
            enrollmentStatus: course.enrollmentStatus,
            lessonsCount: course.lessonsCount,
            currentEnrollment: course.currentEnrollment,
            courseStartDate: course.courseStartDate,
            enrollmentCloseDate: course.enrollmentCloseDate
        }
    });
}

function cosineSimilarity(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < left.length; index += 1) {
        dotProduct += left[index] * right[index];
        leftMagnitude += left[index] * left[index];
        rightMagnitude += right[index] * right[index];
    }

    if (!leftMagnitude || !rightMagnitude) {
        return 0;
    }

    return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function tokenizeText(text) {
    return normalizeText(text)
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= 2);
}

function normalizeForMatch(text) {
    return normalizeText(text)
        .toLowerCase()
        .replace(/["'“”„‟׳״:;!?.,()\[\]{}\/\\|-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function containsAnyPhrase(text, phrases) {
    const normalizedText = normalizeForMatch(text);
    return phrases.some((phrase) => normalizedText.includes(normalizeForMatch(phrase)));
}

function keywordOverlapScore(queryText, documentText) {
    const queryTokens = new Set(tokenizeText(queryText));
    const documentTokens = tokenizeText(documentText);

    if (queryTokens.size === 0 || documentTokens.length === 0) {
        return 0;
    }

    let matches = 0;
    documentTokens.forEach((token) => {
        if (queryTokens.has(token)) {
            matches += 1;
        }
    });

    return Math.min(matches / Math.max(queryTokens.size, 1), 1);
}

function normalizeQueryIntent(queryText) {
    const normalized = normalizeText(queryText).toLowerCase();

    if (!normalized) {
        return 'general';
    }

    if (/\b(רכשתי|קניתי|רכישה|רכישות|קורסים שלי|הקורסים שלי|purchase|bought|my courses|what did i buy|my purchases|my enrolled courses)\b/u.test(normalized)) {
        return 'purchases';
    }

    if (/\b(פעילות|היסטוריה|activity|login|נרשמתי|התחברתי)\b/u.test(normalized)) {
        return 'activity';
    }

    if (/\b(התראה|הודעות|notification|notifications|סימון כנקרא)\b/u.test(normalized)) {
        return 'notifications';
    }

    if (/\b(היסטוריה של השיעור|history|שאלתי|prompt|שיעורים שיצרתי)\b/u.test(normalized)) {
        return 'history';
    }

    if (/\b(קורס|קרוס|course|courses|קורסים|קטגוריה|category|מחיר|מרצה|שיעורים|זול|יקר|הכי זול|הכי יקר|least expensive|cheapest|most expensive|how much|price|cheaper|expensive|lowest price|highest price)\b/u.test(normalized)) {
        return 'courses';
    }

    if (/\b(הרשמה|להירשם|רשומים|נרשמו|registered|sign up|signup|register|joined|עלות|תשלום|free|חינם|cost|pay|paid|fee)\b/u.test(normalized)) {
        return 'platform';
    }

    return 'general';
}

function getCoursePrice(course) {
    const normalizedPrice = Number(course?.coursePrice);
    return Number.isFinite(normalizedPrice) ? normalizedPrice : Number.POSITIVE_INFINITY;
}

function isCoursePriceQuery(queryText) {
    const normalized = normalizeText(queryText).toLowerCase();
    return /\b(זול|הכי זול|cheapest|least expensive|יקר|הכי יקר|most expensive|מחיר הכי נמוך|מחיר הכי גבוה)\b/u.test(normalized);
}

function getFirstMatchedFaqIntent(normalizedQuery) {
    const faqMatchers = [
        {
            intent: 'registration_cost',
            phrases: ['עלות ההרשמה', 'כמה עולה', 'האם זה עולה כסף', 'free', 'חינם', 'cost', 'paid', 'תשלום על ההרשמה', 'הרשמה לפלטפורמה']
        },
        {
            intent: 'how_to_register',
            phrases: ['איך נרשמים', 'איך להירשם', 'תהליך הרשמה', 'register', 'signup', 'sign up', 'להירשם לפלטפורמה', 'איך מצטרפים']
        },
        {
            intent: 'how_many_users',
            phrases: ['כמה רשומים', 'כמה משתמשים', 'how many users', 'how many registered', 'מספר נרשמים', 'מספר רשומים']
        },
        {
            intent: 'most_enrolled_course',
            phrases: ['לאיזה קורס נרשמו הכי הרבה', 'איזה קורס הכי פופולרי', 'קורס עם הכי הרבה נרשמים', 'most enrolled course', 'most registered course']
        },
        {
            intent: 'course_dates',
            phrases: ['מתי נפתחה', 'מתי נפתח', 'מתי נסגרת', 'תאריך פתיחה', 'תאריך סגירת הרשמה', 'when open', 'when close', 'course start', 'enrollment close']
        },
        {
            intent: 'platform_usage',
            phrases: ['איך משתמשים במערכת', 'מה אפשר לעשות באתר', 'מה המערכת יודעת', 'what can i do', 'איך עובדים עם הבוט', 'עזרה באתר']
        },
        {
            intent: 'login_help',
            phrases: ['איך מתחברים', 'איך נכנסים', 'login', 'התחברות', 'סיסמה', 'forgot password', 'שכחתי סיסמה', 'איפוס סיסמה']
        },
        {
            intent: 'purchases_help',
            phrases: ['מה קניתי', 'רכישות שלי', 'קורסים שלי', 'my purchases', 'what did i buy', 'purchase history', 'היסטוריית רכישות', 'קיבלתי חשבונית']
        },
        {
            intent: 'activity_help',
            phrases: ['פעילות אחרונה', 'history', 'היסטוריה', 'login activity', 'activity log', 'מה עשיתי', 'recent activity']
        },
        {
            intent: 'notifications_help',
            phrases: ['התראות', 'notifications', 'notification', 'מה חדש', 'alerts', 'סימון כנקרא']
        },
        {
            intent: 'course_search_help',
            phrases: ['איך מחפשים קורס', 'איך מוצאים קורס', 'חיפוש קורסים', 'course search', 'find a course', 'סינון קורסים']
        },
        {
            intent: 'registration_page',
            phrases: ['איפה עמוד ההרשמה', 'עמוד ההרשמה', 'how to register page', 'register page', 'where is signup', 'where is register']
        },
        {
            intent: 'full_course_catalog',
            phrases: ['מה הקורסים שקיימים כרגע', 'תן לי את כל הקורסים הזמינים', 'כל הקורסים', 'all courses', 'course catalog', 'מה יש באתר', 'מה עוד יש באתר']
        },
        {
            intent: 'course_count',
            phrases: ['כמה קורסים זמינים לרכישה יש', 'כמה קורסים יש', 'how many courses', 'מספר הקורסים', 'course count']
        },
        {
            intent: 'lesson_history_help',
            phrases: ['איך אני יכול לראות שיעורים שאנשים למדו', 'האם ניתן לראות שיעורים שהai יצר לי בעבר', 'היסטוריית שיעורים', 'lesson history', 'view lessons', 'what lessons did ai create']
        },
        {
            intent: 'admin_help',
            phrases: ['איך מנהל יכול לראות את כל מה שקורה באתר', 'מה מנהל יכול לעשות', 'admin can do', 'מרכז הבקרה', 'ניהול תלמידים', 'dashboard', 'admin dashboard']
        }
    ];

    return faqMatchers.find((entry) => containsAnyPhrase(normalizedQuery, entry.phrases))?.intent || '';
}

async function answerFaqIntent({ intent, normalizedQuery, userId }) {
    if (intent === 'registration_cost') {
        return {
            intent: 'platform',
            matched: true,
            answer: 'ההרשמה לפלטפורמה עצמה חינם. תשלום נדרש רק עבור קורסים מסוימים, וביצוע התשלום נעשה דרך Stripe.',
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'how_to_register') {
        return {
            intent: 'platform',
            matched: true,
            answer: 'נרשמים דרך עמוד ההרשמה באתר. ממלאים שם מלא, טלפון, אימייל, תעודת זהות וסיסמה, ואז נכנסים למערכת.',
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'how_many_users') {
        const usersCount = await User.countDocuments();
        return {
            intent: 'platform',
            matched: true,
            answer: `כרגע יש ${usersCount} משתמשים רשומים בפלטפורמה.`,
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'most_enrolled_course') {
        const courses = (await courseService.getAllCourses({ limit: 0, page: 1 })).items || [];

        if (courses.length === 0) {
            return {
                intent: 'platform',
                matched: false,
                answer: 'כרגע אין קורסים זמינים במערכת.',
                sources: [],
                confidence: 1
            };
        }

        const topCourse = [...courses].sort((left, right) => Number(right.currentEnrollment || 0) - Number(left.currentEnrollment || 0))[0];
        return {
            intent: 'platform',
            matched: true,
            answer: `הקורס עם הכי הרבה נרשמים כרגע הוא "${topCourse.courseName}" עם ${Number(topCourse.currentEnrollment || 0)} נרשמים.`,
            sources: [
                {
                    id: topCourse.id,
                    title: topCourse.courseName,
                    sourceType: 'course',
                    score: 1
                }
            ],
            confidence: 1
        };
    }

    if (intent === 'course_dates') {
        const courses = (await courseService.getAllCourses({ limit: 0, page: 1 })).items || [];
        const courseMatch = courses.find((course) => {
            const courseName = String(course.courseName || '').toLowerCase();
            return courseName && normalizedQuery.includes(courseName);
        }) || courses.find((course) => tokenizeText(course.courseName).some((token) => tokenizeText(normalizedQuery).includes(token)));

        if (!courseMatch) {
            return {
                intent: 'platform',
                matched: false,
                answer: 'כדי לענות על תאריכי קורס, תכתוב את שם הקורס או שאל על קורס מסוים.',
                sources: [],
                confidence: 1
            };
        }

        const startDate = courseMatch.courseStartDate ? new Date(courseMatch.courseStartDate).toLocaleDateString('he-IL') : 'לא זמין';
        const closeDate = courseMatch.enrollmentCloseDate ? new Date(courseMatch.enrollmentCloseDate).toLocaleDateString('he-IL') : 'לא זמין';
        const statusText = courseMatch.enrollmentStatus === 'active' ? 'פתוחה' : 'סגורה';

        return {
            intent: 'platform',
            matched: true,
            answer: `הקורס "${courseMatch.courseName}" כרגע ${statusText}. תאריך פתיחת הקורס: ${startDate}. תאריך סגירת ההרשמה: ${closeDate}.`,
            sources: [
                {
                    id: courseMatch.id,
                    title: courseMatch.courseName,
                    sourceType: 'course',
                    score: 1
                }
            ],
            confidence: 1
        };
    }

    if (intent === 'platform_usage') {
        return {
            intent: 'platform',
            matched: true,
            answer: 'המערכת מאפשרת הרשמה, התחברות, צפייה בקורסים, חיפוש קורסים, רכישת קורסים, מעקב אחרי פעילות, קבלת התראות ושימוש בבוט לעזרה.',
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'login_help') {
        return {
            intent: 'platform',
            matched: true,
            answer: 'להתחברות צריך להשתמש באימייל והסיסמה שבחרת בהרשמה. אם שכחת סיסמה, יש מסלול איפוס סיסמה דרך האתר.',
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'purchases_help') {
        const purchases = await purchaseService.getPurchasesForUser({ userId, page: 1, limit: 10 });
        const items = purchases.items || [];

        if (items.length === 0) {
            return {
                intent: 'purchases',
                matched: true,
                answer: 'לא נמצאו רכישות בחשבון הזה.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent: 'purchases',
            matched: true,
            answer: `מצאתי את הרכישות האחרונות שלך: ${items.map((item) => `${item.courseName} (${item.status})`).join(', ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.courseName,
                sourceType: 'purchase',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'activity_help') {
        const activities = await userActivityService.getActivitiesForUser({ userId, page: 1, limit: 10 });
        const items = activities.items || [];

        if (items.length === 0) {
            return {
                intent: 'activity',
                matched: true,
                answer: 'לא נמצאה פעילות עדכנית לחשבון הזה.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent: 'activity',
            matched: true,
            answer: `הפעילות האחרונה שלך כוללת: ${items.slice(0, 5).map((item) => item.description).join(' | ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.type,
                sourceType: 'activity',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'notifications_help') {
        const notifications = await notificationService.getUserNotifications({ userId, page: 1, limit: 10 });
        const items = notifications.items || [];

        if (items.length === 0) {
            return {
                intent: 'notifications',
                matched: true,
                answer: 'אין לך התראות כרגע.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent: 'notifications',
            matched: true,
            answer: `ההתראות האחרונות שלך כוללות: ${items.slice(0, 5).map((item) => item.title).join(', ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.title,
                sourceType: 'notification',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'course_search_help') {
        const courses = await courseService.getAllCourses({ limit: 0, page: 1 });
        const items = courses.items || [];

        if (items.length === 0) {
            return {
                intent: 'courses',
                matched: true,
                answer: 'כרגע אין קורסים זמינים במערכת.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent: 'courses',
            matched: true,
            answer: `אפשר לחפש קורסים לפי שם, קטגוריה או מרצה. כרגע יש ${items.length} קורסים זמינים במערכת.`,
            sources: items.slice(0, 5).map((course) => ({
                id: course.id,
                title: course.courseName,
                sourceType: 'course',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'registration_page') {
        return {
            intent: 'platform',
            matched: true,
            answer: 'עמוד ההרשמה נמצא בנתיב /register. אפשר להגיע אליו גם מכפתור ההרשמה בעמוד הבית או דרך תפריט הניווט.',
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'full_course_catalog') {
        const courses = await courseService.getAllCourses({ limit: 0, page: 1 });
        const items = courses.items || [];

        if (items.length === 0) {
            return {
                intent: 'courses',
                matched: true,
                answer: 'כרגע לא נמצאו קורסים במערכת.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent: 'courses',
            matched: true,
            answer: `יש כרגע ${items.length} קורסים זמינים:\n${items.map((course) => `- ${course.courseName} | מחיר: ${course.coursePrice} | קטגוריה: ${course.category}`).join('\n')}`,
            sources: items.map((course) => ({
                id: course.id,
                title: course.courseName,
                sourceType: 'course',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'course_count') {
        const courses = await courseService.getAllCourses({ limit: 0, page: 1 });
        const items = courses.items || [];

        return {
            intent: 'courses',
            matched: true,
            answer: `יש כרגע ${items.length} קורסים זמינים לרכישה במערכת.`,
            sources: items.slice(0, 5).map((course) => ({
                id: course.id,
                title: course.courseName,
                sourceType: 'course',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'lesson_history_help') {
        return {
            intent: 'history',
            matched: true,
            answer: 'אפשר לראות את היסטוריית השיעורים בעמוד /history. משתמש רגיל רואה את ההיסטוריה שלו, ומנהל יכול לראות היסטוריה של משתמש אחר דרך /history/:userId.',
            sources: [],
            confidence: 1
        };
    }

    if (intent === 'admin_help') {
        return {
            intent: 'admin',
            matched: true,
            answer: 'מנהל יכול לראות משתמשים, שיעורים/היסטוריית למידה, דשבורד ניהולי, הודעות ונתוני פעילות ורכישות. הנתיבים העיקריים הם /admin, /admin/dashboard ו-/admin/messages.',
            sources: [],
            confidence: 1
        };
    }

    return null;
}

async function buildKnowledgeBundle({ userId, query }) {
    const dbContext = await buildDbAnswerContext({ userId, query });

    if (dbContext.matched) {
        return {
            answer: dbContext.answer,
            sources: dbContext.sources,
            fallback: false,
            score: dbContext.confidence,
            intent: dbContext.intent,
            fromDb: true
        };
    }

    const queryEmbedding = await getEmbedding(query);
    const matches = await similaritySearch(queryEmbedding, query, 8);
    const topMatch = matches[0];

    const courses = await courseService.getAllCourses({ limit: 0, page: 1 });
    const courseItems = courses.items || [];
    const topCoursesByPrice = [...courseItems].sort((left, right) => getCoursePrice(left) - getCoursePrice(right)).slice(0, 3);
    const topCoursesByRelevance = courseItems.filter((course) => {
        const haystack = [course.courseName, course.category, course.courseDescription, course.lecturerName].filter(Boolean).join(' ');
        return keywordOverlapScore(query, haystack) > 0;
    }).slice(0, 5);

    return {
        answer: '',
        sources: matches.map((item) => ({
            id: item.id,
            title: item.title,
            sourceType: item.sourceType,
            score: item.score,
            semanticScore: item.semanticScore,
            keywordScore: item.keywordScore
        })),
        fallback: false,
        score: topMatch?.score || 0,
        intent: normalizeQueryIntent(query),
        fromDb: false,
        queryEmbedding,
        matches,
        topCoursesByPrice,
        topCoursesByRelevance,
        courseCount: courseItems.length
    };
}

async function buildDbAnswerContext({ userId, query }) {
    const intent = normalizeQueryIntent(query);
    const normalizedQuery = normalizeText(query).toLowerCase();
    const faqIntent = getFirstMatchedFaqIntent(normalizedQuery);

    if (faqIntent) {
        const faqAnswer = await answerFaqIntent({ intent: faqIntent, normalizedQuery, userId });

        if (faqAnswer) {
            return faqAnswer;
        }
    }

    const platformHint = /\b(הרשמה|להירשם|נרשמו|רשומים|registered|sign up|signup|register|joined|עלות|תשלום|free|חינם|cost|pay|paid|fee)\b/u.test(normalizedQuery);
    const purchaseHint = /\b(רכשתי|קניתי|רכישה|רכישות|קורסים שלי|הקורסים שלי|purchase|bought|my purchases|my enrolled courses|what did i buy)\b/u.test(normalizedQuery);
    const courseHint = /\b(קורס|קרוס|course|courses|קורסים|קטגוריה|category|מחיר|מרצה|שיעורים|זול|יקר|הכי זול|הכי יקר|price|cheapest|cheaper|expensive)\b/u.test(normalizedQuery);

    if (platformHint || intent === 'platform') {
        const [usersCount, allCourses] = await Promise.all([
            User.countDocuments(),
            courseService.getAllCourses({ limit: 0, page: 1 })
        ]);

        const courses = allCourses.items || [];
        const mostEnrolledCourse = courses.length > 0
            ? [...courses].sort((left, right) => Number(right.currentEnrollment || 0) - Number(left.currentEnrollment || 0))[0]
            : null;

        const courseNameMatch = courses.find((course) => {
            const courseName = String(course.courseName || '').toLowerCase();
            return courseName && normalizedQuery.includes(courseName);
        }) || courses.find((course) => {
            const queryTokens = tokenizeText(normalizedQuery);
            const courseTokens = tokenizeText(course.courseName);
            return courseTokens.some((token) => queryTokens.includes(token));
        });

        if (/\b(עלות|תשלום|paid|free|חינם|cost|fee)\b/u.test(normalizedQuery)) {
            return {
                intent: 'platform',
                matched: true,
                answer: 'ההרשמה לפלטפורמה עצמה היא חינם. תשלום נדרש רק עבור קורסים מסוימים באמצעות Stripe.',
                sources: [],
                confidence: 1
            };
        }

        if (/\b(איך|how).*(הרשמה|register|signup)|\b(להירשם|register|signup)\b/u.test(normalizedQuery)) {
            return {
                intent: 'platform',
                matched: true,
                answer: 'נרשמים דרך עמוד ההרשמה באתר. צריך למלא שם מלא, טלפון, אימייל, תעודת זהות וסיסמה. לאחר מכן נכנסים למערכת וממשיכים ללמידה.',
                sources: [],
                confidence: 1
            };
        }

        if (/\b(כמה|how many).*(רשומים|נרשמו|users|registered|members)\b/u.test(normalizedQuery) || /\b(כמה רשומים|how many registered)\b/u.test(normalizedQuery)) {
            return {
                intent: 'platform',
                matched: true,
                answer: `כרגע יש ${usersCount} משתמשים רשומים בפלטפורמה.`,
                sources: [],
                confidence: 1
            };
        }

        if (/\b(לאיזה|which).*(קורס|course).*(הכי הרבה|most|most enrolled|many registered)|\b(מי|what).*(הכי הרבה נרשמו|most enrolled)\b/u.test(normalizedQuery)) {
            if (!mostEnrolledCourse) {
                return {
                    intent: 'platform',
                    matched: false,
                    answer: 'כרגע אין לי מספיק קורסים כדי לחשב איזה קורס קיבל הכי הרבה נרשמים.',
                    sources: [],
                    confidence: 1
                };
            }

            return {
                intent: 'platform',
                matched: true,
                answer: `הקורס עם הכי הרבה נרשמים כרגע הוא "${mostEnrolledCourse.courseName}" עם ${Number(mostEnrolledCourse.currentEnrollment || 0)} נרשמים.`,
                sources: [
                    {
                        id: mostEnrolledCourse.id,
                        title: mostEnrolledCourse.courseName,
                        sourceType: 'course',
                        score: 1
                    }
                ],
                confidence: 1
            };
        }

        if (courseNameMatch) {
            const startDate = courseNameMatch.courseStartDate ? new Date(courseNameMatch.courseStartDate).toLocaleDateString('he-IL') : null;
            const closeDate = courseNameMatch.enrollmentCloseDate ? new Date(courseNameMatch.enrollmentCloseDate).toLocaleDateString('he-IL') : null;
            const statusText = courseNameMatch.enrollmentStatus === 'active' ? 'פתוחה' : 'סגורה';

            if (/\b(מתי|when).*(נסגרת|close|closed|נגמרת|ends)|\b(סגירת הרשמה|enrollment close)\b/u.test(normalizedQuery) && /\b(מתי|when)|\b(נסגרת|close|closed|נגמרת|ends)\b/u.test(normalizedQuery)) {
                return {
                    intent: 'platform',
                    matched: true,
                    answer: `ההרשמה לקורס "${courseNameMatch.courseName}" ${statusText}. תאריך סגירת ההרשמה הוא ${closeDate || 'לא זמין כרגע'}.`,
                    sources: [
                        {
                            id: courseNameMatch.id,
                            title: courseNameMatch.courseName,
                            sourceType: 'course',
                            score: 1
                        }
                    ],
                    confidence: 1
                };
            }

            if (/\b(מתי|when).*(נפתח|opened|open|פתיחה|start)|\b(תאריך פתיחה|course start)\b/u.test(normalizedQuery)) {
                return {
                    intent: 'platform',
                    matched: true,
                    answer: `הקורס "${courseNameMatch.courseName}" ${statusText}. תאריך הפתיחה שלו הוא ${startDate || 'לא זמין כרגע'}.`,
                    sources: [
                        {
                            id: courseNameMatch.id,
                            title: courseNameMatch.courseName,
                            sourceType: 'course',
                            score: 1
                        }
                    ],
                    confidence: 1
                };
            }

            return {
                intent: 'platform',
                matched: true,
                answer: `מצאתי את הקורס "${courseNameMatch.courseName}". הוא ${statusText}, תאריך פתיחה: ${startDate || 'לא זמין'}, תאריך סגירת הרשמה: ${closeDate || 'לא זמין'}, ונרשמו אליו ${Number(courseNameMatch.currentEnrollment || 0)} לומדים.`,
                sources: [
                    {
                        id: courseNameMatch.id,
                        title: courseNameMatch.courseName,
                        sourceType: 'course',
                        score: 1
                    }
                ],
                confidence: 1
            };
        }

        if (mostEnrolledCourse) {
            return {
                intent: 'platform',
                matched: true,
                answer: `כרגע יש ${usersCount} משתמשים רשומים בפלטפורמה. הקורס עם הכי הרבה נרשמים הוא "${mostEnrolledCourse.courseName}" עם ${Number(mostEnrolledCourse.currentEnrollment || 0)} נרשמים.`,
                sources: [
                    {
                        id: mostEnrolledCourse.id,
                        title: mostEnrolledCourse.courseName,
                        sourceType: 'course',
                        score: 1
                    }
                ],
                confidence: 1
            };
        }

        return {
            intent: 'platform',
            matched: false,
            answer: `כרגע יש ${usersCount} משתמשים רשומים בפלטפורמה.`,
            sources: [],
            confidence: 1
        };
    }

    if (purchaseHint && intent !== 'courses') {
        const purchases = await purchaseService.getPurchasesForUser({ userId, page: 1, limit: 10 });
        const items = purchases.items || [];

        if (items.length === 0) {
            return {
                intent: 'purchases',
                matched: true,
                answer: 'לא נמצאו רכישות בחשבון הזה.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent: 'purchases',
            matched: true,
            answer: `מצאתי את הקורסים שרכשת: ${items.map((item) => `${item.courseName} במחיר ${item.price}`).join(', ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.courseName,
                sourceType: 'purchase',
                score: 1
            })),
            confidence: 1
        };
    }

    if (courseHint && intent !== 'purchases') {
        const courses = await courseService.getAllCourses({ limit: 0, page: 1 });
        const allItems = courses.items || [];

        if (allItems.length === 0) {
            return {
                intent: 'courses',
                matched: true,
                answer: 'לא נמצאו קורסים כרגע.',
                sources: [],
                confidence: 1
            };
        }

        const cheapestCourse = [...allItems].sort((left, right) => getCoursePrice(left) - getCoursePrice(right))[0];
        const mostExpensiveCourse = [...allItems].sort((left, right) => getCoursePrice(right) - getCoursePrice(left))[0];

        if (/\b(זול|הכי זול|cheapest|least expensive|lowest price|cheap)\b/u.test(normalizedQuery)) {
            return {
                intent: 'courses',
                matched: true,
                answer: `הקורס הכי זול כרגע הוא "${cheapestCourse.courseName}" במחיר ${cheapestCourse.coursePrice}.`,
                sources: [{
                    id: cheapestCourse.id,
                    title: cheapestCourse.courseName,
                    sourceType: 'course',
                    score: 1
                }],
                confidence: 1
            };
        }

        if (/\b(יקר|הכי יקר|most expensive|highest price|expensive)\b/u.test(normalizedQuery)) {
            return {
                intent: 'courses',
                matched: true,
                answer: `הקורס הכי יקר כרגע הוא "${mostExpensiveCourse.courseName}" במחיר ${mostExpensiveCourse.coursePrice}.`,
                sources: [{
                    id: mostExpensiveCourse.id,
                    title: mostExpensiveCourse.courseName,
                    sourceType: 'course',
                    score: 1
                }],
                confidence: 1
            };
        }

        const exactMatches = allItems.filter((course) => {
            return [course.courseName, course.category, course.courseDescription, course.lecturerName]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedQuery));
        });

        const selected = exactMatches.length > 0 ? exactMatches : allItems.slice(0, 5);

        return {
            intent: 'courses',
            matched: true,
            answer: `מצאתי ${allItems.length} קורסים במערכת. כמה דוגמאות: ${selected.map((course) => `${course.courseName} במחיר ${course.coursePrice}`).join(', ')}.`,
            sources: selected.map((course) => ({
                id: course.id,
                title: course.courseName,
                sourceType: 'course',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'purchases') {
        const purchases = await purchaseService.getPurchasesForUser({ userId, page: 1, limit: 10 });
        const items = purchases.items || [];

        if (items.length === 0) {
            return {
                intent,
                matched: false,
                answer: 'לא נמצאו רכישות או קורסים שנרכשו לחשבון הזה.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent,
            matched: true,
            answer: `אלו הקורסים שנרכשו לאחרונה: ${items.map((item) => `${item.courseName} (${item.status})`).join(', ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.courseName,
                sourceType: 'purchase',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'activity') {
        const activities = await userActivityService.getActivitiesForUser({ userId, page: 1, limit: 10 });
        const items = activities.items || [];

        if (items.length === 0) {
            return {
                intent,
                matched: false,
                answer: 'לא נמצאה פעילות עדכנית לחשבון הזה.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent,
            matched: true,
            answer: `הפעילויות האחרונות שלך הן: ${items.slice(0, 5).map((item) => item.description).join(' | ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.type,
                sourceType: 'activity',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'notifications') {
        const notifications = await notificationService.getUserNotifications({ userId, page: 1, limit: 10 });
        const items = notifications.items || [];

        if (items.length === 0) {
            return {
                intent,
                matched: false,
                answer: 'אין לך התראות כרגע.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent,
            matched: true,
            answer: `ההתראות האחרונות שלך כוללות: ${items.slice(0, 5).map((item) => item.title).join(', ')}.`,
            sources: items.map((item) => ({
                id: item.id,
                title: item.title,
                sourceType: 'notification',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'history') {
        const history = await historyService.getHistoryForUser(userId);
        if (!history || history.length === 0) {
            return {
                intent,
                matched: false,
                answer: 'לא נמצאה היסטוריית שיעורים לחשבון הזה.',
                sources: [],
                confidence: 1
            };
        }

        return {
            intent,
            matched: true,
            answer: `היסטוריית השיעורים האחרונה שלך כוללת: ${history.slice(0, 5).map((item) => item.prompt).join(', ')}.`,
            sources: history.slice(0, 5).map((item) => ({
                id: item._id,
                title: item.prompt,
                sourceType: 'history',
                score: 1
            })),
            confidence: 1
        };
    }

    if (intent === 'courses') {
        const courses = await courseService.getAllCourses({ limit: 10, page: 1 });
        const allCourses = await courseService.getAllCourses({ limit: 0, page: 1 });
        const items = courses.items || [];
        const allItems = allCourses.items || [];

        if (allItems.length === 0) {
            return {
                intent,
                matched: false,
                answer: 'לא נמצאו קורסים כרגע.',
                sources: [],
                confidence: 1
            };
        }

        const lowerQuery = normalizeText(query).toLowerCase();
        const exactMatches = allItems.filter((course) => {
            return [course.courseName, course.category, course.courseDescription, course.lecturerName]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(lowerQuery));
        });

        const cheapestCourse = [...allItems].sort((left, right) => getCoursePrice(left) - getCoursePrice(right))[0];
        const mostExpensiveCourse = [...allItems].sort((left, right) => getCoursePrice(right) - getCoursePrice(left))[0];

        if (/\b(זול|הכי זול|cheapest|least expensive)\b/u.test(lowerQuery) || lowerQuery.includes('מחיר הכי נמוך')) {
            if (!cheapestCourse) {
                return {
                    intent,
                    matched: false,
                    answer: 'לא הצלחתי למצוא קורסים עם מחיר תקין כרגע.',
                    sources: [],
                    confidence: 1
                };
            }

            return {
                intent,
                matched: true,
                answer: `הקורס הכי זול כרגע הוא "${cheapestCourse.courseName}" במחיר ${cheapestCourse.coursePrice}.`,
                sources: [{
                    id: cheapestCourse.id,
                    title: cheapestCourse.courseName,
                    sourceType: 'course',
                    score: 1
                }],
                confidence: 1
            };
        }

        if (/\b(יקר|הכי יקר|most expensive)\b/u.test(lowerQuery) || lowerQuery.includes('מחיר הכי גבוה')) {
            if (!mostExpensiveCourse) {
                return {
                    intent,
                    matched: false,
                    answer: 'לא הצלחתי למצוא קורסים עם מחיר תקין כרגע.',
                    sources: [],
                    confidence: 1
                };
            }

            return {
                intent,
                matched: true,
                answer: `הקורס הכי יקר כרגע הוא "${mostExpensiveCourse.courseName}" במחיר ${mostExpensiveCourse.coursePrice}.`,
                sources: [{
                    id: mostExpensiveCourse.id,
                    title: mostExpensiveCourse.courseName,
                    sourceType: 'course',
                    score: 1
                }],
                confidence: 1
            };
        }

        const selected = exactMatches.length > 0 ? exactMatches : items;

        return {
            intent,
            matched: true,
            answer: `יש כרגע ${allItems.length} קורסים זמינים. לדוגמה: ${selected.slice(0, 5).map((course) => `${course.courseName} (${course.category}) במחיר ${course.coursePrice}`).join(', ')}.`,
            sources: selected.map((course) => ({
                id: course.id,
                title: course.courseName,
                sourceType: 'course',
                score: 1
            })),
            confidence: 1
        };
    }

    return {
        intent: 'general',
        matched: false,
        answer: '',
        sources: [],
        confidence: 0
    };
}

async function similaritySearch(queryEmbedding, queryText, limit = 5) {
    const rows = await RagDocument.find().lean();

    const scored = rows.map((row) => ({
        id: buildDocumentId(row.sourceType, row.sourceId),
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        semanticScore: cosineSimilarity(queryEmbedding, row.embedding),
        keywordScore: keywordOverlapScore(queryText, `${row.title} ${row.content}`)
    }));

    scored.forEach((item) => {
        item.score = (item.semanticScore * 0.7) + (item.keywordScore * 0.3);
    });

    return scored
        .sort((left, right) => right.score - left.score)
        .slice(0, limit);
}

function isRateLimited(userId) {
    const now = Date.now();
    const bucket = requestCounters.get(String(userId)) || [];
    const freshBucket = bucket.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

    if (freshBucket.length >= RATE_LIMIT_MAX) {
        requestCounters.set(String(userId), freshBucket);
        return true;
    }

    freshBucket.push(now);
    requestCounters.set(String(userId), freshBucket);
    return false;
}

async function logUnansweredQuery({ userId, query, reason, score }) {
    try {
        await RagQueryLog.create({ userId, query, reason, score });
    } catch (error) {
        console.error('Failed to log unanswered RAG query:', error.message);
    }
}

async function answerQuery({ userId, query }) {
    if (!userId) {
        throw new AppError('חסרים נתונים נדרשים לשאילתה', 400);
    }

    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
        throw new AppError('יש להזין שאלה', 400);
    }

    if (isRateLimited(userId)) {
        throw new AppError('יותר מדי בקשות. נסה שוב מאוחר יותר.', 429);
    }

    const knowledgeBundle = await buildKnowledgeBundle({ userId, query: normalizedQuery });

    if (knowledgeBundle.fromDb) {
        return knowledgeBundle;
    }

    const client = getOpenAIClient();
    if (!client) {
        return {
            answer: 'יש לי כרגע מידע חלקי בלבד, אבל אני עדיין יכול לעזור בשאלות על קורסים, הרשמה, תשלום והיקף משתמשים. נסה לנסח את השאלה יותר ספציפית.',
            sources: knowledgeBundle.sources || [],
            fallback: true,
            score: knowledgeBundle.score || 0,
            intent: knowledgeBundle.intent || 'general',
            fromDb: false
        };
    }

    const matches = knowledgeBundle.matches || [];
    const topMatch = matches[0];

    const contextParts = [];

    if ((knowledgeBundle.topCoursesByRelevance || []).length > 0) {
        contextParts.push(
            `קורסים רלוונטיים מה-DB:\n${knowledgeBundle.topCoursesByRelevance.map((course) => `- ${course.courseName} | קטגוריה: ${course.category} | מחיר: ${course.coursePrice} | מרצה: ${course.lecturerName}`).join('\n')}`
        );
    }

    if ((knowledgeBundle.topCoursesByPrice || []).length > 0) {
        contextParts.push(
            `קורסים לפי מחיר מה-DB:\n${knowledgeBundle.topCoursesByPrice.map((course) => `- ${course.courseName} | מחיר: ${course.coursePrice} | קטגוריה: ${course.category}`).join('\n')}`
        );
    }

    if (matches.length > 0) {
        contextParts.push(
            `מקורות ידע נוספים:\n${matches
                .filter((item) => item.score >= SIMILARITY_THRESHOLD || item.keywordScore > 0)
                .map((item) => `- ${item.title}: ${item.content}`)
                .join('\n')}`
        );
    }

    const contextBlock = contextParts.join('\n\n');

    if (!contextBlock.trim()) {
        await logUnansweredQuery({
            userId,
            query: normalizedQuery,
            reason: 'no_context',
            score: topMatch?.score || 0
        });

        return {
            answer: 'לא הצלחתי לבנות תשובה מלאה מהמקורות הקיימים כרגע, אבל יש לי רמזים חלקיים במערכת. אם תרצי, אפשר לחדד את השאלה עם קורס, קטגוריה או פעולה ספציפית.',
            sources: matches.map((item) => ({
                id: item.id,
                title: item.title,
                sourceType: item.sourceType,
                score: item.score,
                semanticScore: item.semanticScore,
                keywordScore: item.keywordScore
            })),
            fallback: false,
            score: topMatch?.score || 0
        };
    }

    try {
        const completion = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            temperature: 0.2,
            max_tokens: 500,
            messages: [
                {
                    role: 'system',
                    content: [
                        'אתה עוזר תמיכה חכם לפלטפורמת למידה.',
                        'ענה רק על סמך ההקשר שסופק.',
                        'אם שואלים על קורס, השתמש בשם, תיאור, קטגוריה, מרצה, מחיר, מספר שיעורים, תאריכי פתיחה/סגירה, סטטוס הרשמה ומספר נרשמים אם הם זמינים.',
                        'אם יש כמה קורסים רלוונטיים, השווה ביניהם ותן תשובה ברורה ומעשית.',
                                'אם המידע לא מספיק, אמור במפורש אילו פרטים חסרים, אבל תמיד נסח תשובה שימושית על בסיס מה שכן זמין.',
                        'אל תמציא מידע שלא קיים במקורות.'
                    ].join(' ')
                },
                {
                    role: 'user',
                    content: `הקשר רלוונטי:\n\n${contextBlock}\n\nשאלת המשתמש: ${normalizedQuery}`
                }
            ]
        });

        const answer = completion?.choices?.[0]?.message?.content?.trim();
        if (!answer) {
            throw new Error('Empty completion');
        }

        return {
            answer,
            sources: matches.map((item) => ({
                id: item.id,
                title: item.title,
                sourceType: item.sourceType,
                score: item.score,
                semanticScore: item.semanticScore,
                keywordScore: item.keywordScore
            })),
            fallback: false,
            score: topMatch.score
        };
    } catch (error) {
        console.error('RAG chat completion failed:', error.message);
        await logUnansweredQuery({
            userId,
            query: normalizedQuery,
            reason: 'completion_error',
            score: topMatch?.score || 0
        });

        return {
            answer: contextBlock
                ? `יש לי מידע חלקי מהמערכת, אבל לא הצלחתי לנסח תשובה מלאה כרגע. המידע הזמין כולל: ${contextBlock.slice(0, 500)}.`
                : 'לא הצלחתי לייצר תשובה כרגע מהמידע הקיים.',
            sources: matches.map((item) => ({
                id: item.id,
                title: item.title,
                sourceType: item.sourceType,
                score: item.score,
                semanticScore: item.semanticScore,
                keywordScore: item.keywordScore
            })),
            fallback: false,
            score: topMatch?.score || 0
        };
    }
}

async function bootstrapKnowledgeBase() {
    await Promise.allSettled([
        seedStaticDocuments(),
        seedCatalogDocuments(),
        seedCourseCatalog()
    ]);
}

module.exports = {
    seedStaticDocuments,
    seedCatalogDocuments,
    seedCourseCatalog,
    bootstrapKnowledgeBase,
    syncCategories,
    syncCourse,
    answerQuery,
    removeDocumentBySource,
    upsertDocument
};
