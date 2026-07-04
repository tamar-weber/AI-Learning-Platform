const crypto = require('crypto');
const OpenAI = require('openai');
const RagDocument = require('../middleware/RagDocument');
const Course = require('../middleware/Course');
const { categories, subCategories } = require('./categoryService');
const RagQueryLog = require('../middleware/RagQueryLog');
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
const RATE_LIMIT_MAX = Number(process.env.RAG_RATE_LIMIT_MAX || 12);
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
        content: [
            `שם הקורס: ${course.courseName}`,
            `מרצה: ${course.lecturerName}`,
            `תיאור: ${course.courseDescription}`,
            `קטגוריה: ${course.category}`,
            `מספר שיעורים: ${course.lessonsCount}`,
            `מחיר: ${course.coursePrice}`,
            `סטטוס הרשמה: ${course.enrollmentStatus}`
        ].join('\n'),
        metadata: {
            coursePrice: course.coursePrice,
            category: course.category,
            enrollmentStatus: course.enrollmentStatus
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

    const purchaseHint = /\b(רכשתי|קניתי|רכישה|רכישות|קורסים שלי|הקורסים שלי|purchase|bought|my purchases|my enrolled courses|what did i buy)\b/u.test(normalizedQuery);
    const courseHint = /\b(קורס|קרוס|course|courses|קורסים|קטגוריה|category|מחיר|מרצה|שיעורים|זול|יקר|הכי זול|הכי יקר|price|cheapest|cheaper|expensive)\b/u.test(normalizedQuery);

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

    const client = getOpenAIClient();
    if (!client) {
        throw new AppError('OpenAI API key is missing', 503);
    }

    const knowledgeBundle = await buildKnowledgeBundle({ userId, query: normalizedQuery });

    if (knowledgeBundle.fromDb) {
        return knowledgeBundle;
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
                        'אם המידע לא מספיק, אמור שאתה לא בטוח והצע פנייה לתמיכה.'
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
