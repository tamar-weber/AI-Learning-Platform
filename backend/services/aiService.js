const OpenAI = require('openai');


let openai;

// פונקציה שמאתחלת את החיבור רק פעם אחת
function getOpenAIClient() {
    if (!openai && process.env.OPENAI_API_KEY) {
        try {
            console.log('🔑 מנסה להתחבר ל-OpenAI עם המפתח:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
            
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            console.log("✅ OpenAI client initialized successfully!");
            return openai;
        } catch (error) {
            console.error("❌ Failed to initialize OpenAI client:", error.message);
            openai = null;
        }
    }
    return openai;
}

// פונקציה אמיתית שמתחברת ל-OpenAI
async function getRealAIResponse(prompt, category, subCategory) {
    console.log(`🤖 מנסה לשלוח ל-OpenAI: "${prompt}"`);
    
    const client = getOpenAIClient();
    if (!client) {
        console.error("❌ OpenAI client is not available. חוזר לתשובה מזויפת.");
        return getMockAIResponse(prompt, category, subCategory);
    }

    try {
        const fullPrompt = `
        אתה מורה מומחה. תכין שיעור קצר ומעניין על הנושא הבא:
        
        קטגוריה: ${category}
        תת-קטגוריה: ${subCategory}
        השאלה/הנושא: ${prompt}
        
        אנא כתוב שיעור בן 2-3 פסקאות שיהיה:
        1. מעניין וקל להבנה
        2. עם עובדות מעניינות
        3. בעברית ברורה
        `;

        console.log('📤 שולח בקשה ל-OpenAI...');
        
        const response = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "אתה מורה מקצועי שכותב שיעורים קצרים ומעניינים בעברית"
                },
                {
                    role: "user", 
                    content: fullPrompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        const aiResponse = response.choices[0].message.content;
        console.log('✅ קיבלנו תשובה מ-OpenAI בהצלחה!');
        return aiResponse;

    } catch (error) {
        console.error("❌ שגיאה בחיבור ל-OpenAI:", error.message);
        console.error("פרטי השגיאה:", error);
        return getMockAIResponse(prompt, category, subCategory);
    }
}

// פונקציית גיבוי
function getMockAIResponse(prompt, category = "כללי", subCategory = "כללי") {
    return `🎓 שיעור על: ${prompt}

זהו שיעור שנוצר על ידי מערכת הגיבוי. במערכת האמיתית, כאן היה מופיע שיעור מפורט שנוצר על ידי ChatGPT.

**נושא:** ${category} - ${subCategory}

זוהי תשובה זמנית שמראה את פונקציונליות המערכת! 🚀`;
}

// פונקציה ראשית
async function generateLesson(prompt, category = "כללי", subCategory = "כללי") {
    console.log(`📚 generateLesson נקראה עם: prompt="${prompt}", category="${category}", subCategory="${subCategory}"`);
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
        console.log("🤖 משתמש ב-OpenAI האמיתי...");
        return await getRealAIResponse(prompt, category, subCategory);
    } else {
        console.log("🎭 אין מפתח API תקין, משתמש בתשובה מזויפת");
        return getMockAIResponse(prompt, category, subCategory);
    }
}

module.exports = { generateLesson };