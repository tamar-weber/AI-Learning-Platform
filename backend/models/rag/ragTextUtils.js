// Pure text/matching utilities used across the RAG pipeline.
// Extracted from the original monolithic ragService.js - no external
// dependencies beyond Node's crypto module, so this is safe to unit test
// in isolation.
const crypto = require('crypto');

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
        .replace(/["'“”„‟׳״:;!?.,()[\]{}/\\|-]/g, ' ')
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

module.exports = {
    normalizeText,
    buildDocumentId,
    formatDateForRag,
    cosineSimilarity,
    tokenizeText,
    normalizeForMatch,
    containsAnyPhrase,
    keywordOverlapScore,
    normalizeQueryIntent,
    getCoursePrice,
    isCoursePriceQuery
};
