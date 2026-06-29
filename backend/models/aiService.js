const OpenAI = require('openai');

let openaiClient = null;

function isValidApiKey(apiKey) {
    return typeof apiKey === 'string' && apiKey.trim().startsWith('sk-');
}

function getOpenAIClient() {
    if (!openaiClient && isValidApiKey(process.env.OPENAI_API_KEY)) {
        try {
            openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            console.log('✅ OpenAI client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize OpenAI client:', error.message);
            openaiClient = null;
        }
    }

    return openaiClient;
}

function buildLessonPrompt(prompt, category = 'כללי', subCategory = 'כללי') {
    return [
        'אתה מורה מומחה.',
        'תכין שיעור קצר ומעניין על הנושא הבא:',
        '',
        `קטגוריה: ${category}`,
        `תת-קטגוריה: ${subCategory}`,
        `השאלה/הנושא: ${prompt}`,
        '',
        'אנא כתוב שיעור בן 2-3 פסקאות שיהיה:',
        '1. מעניין וקל להבנה',
        '2. עם עובדות מעניינות',
        '3. בעברית ברורה'
    ].join('\n');
}

function getMockAIResponse(prompt, category = 'כללי', subCategory = 'כללי') {
    return `🎓 שיעור על: ${prompt}

זהו שיעור שנוצר על ידי מערכת הגיבוי. במערכת האמיתית, כאן היה מופיע שיעור מפורט שנוצר על ידי ChatGPT.

**נושא:** ${category} - ${subCategory}

זוהי תשובה זמנית שמראה את פונקציונליות המערכת! 🚀`;
}

async function getRealAIResponse(prompt, category = 'כללי', subCategory = 'כללי', options = {}) {
    const client = getOpenAIClient();

    if (!client) {
        console.warn('⚠️ OpenAI client is not available, using fallback response');
        return getMockAIResponse(prompt, category, subCategory);
    }

    try {
        const response = await client.chat.completions.create({
            model: options.model || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: options.systemPrompt || 'אתה מורה מקצועי שכותב שיעורים קצרים ומעניינים בעברית'
                },
                {
                    role: 'user',
                    content: buildLessonPrompt(prompt, category, subCategory)
                }
            ],
            max_tokens: options.maxTokens || 500,
            temperature: options.temperature ?? 0.7
        });

        const aiResponse = response?.choices?.[0]?.message?.content?.trim();
        return aiResponse || getMockAIResponse(prompt, category, subCategory);
    } catch (error) {
        console.error('❌ שגיאה בחיבור ל-OpenAI:', error.message);
        return getMockAIResponse(prompt, category, subCategory);
    }
}

async function generateLesson(prompt, category = 'כללי', subCategory = 'כללי', options = {}) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt is required');
    }

    if (isValidApiKey(process.env.OPENAI_API_KEY)) {
        return getRealAIResponse(prompt, category, subCategory, options);
    }

    console.warn('🎭 אין מפתח API תקין, משתמש בתשובה מזויפת');
    return getMockAIResponse(prompt, category, subCategory);
}

module.exports = { generateLesson };