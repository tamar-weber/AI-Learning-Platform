// services/aiService.js
const OpenAI = require('openai');

// יצירת חיבור ל-OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// פונקציה אמיתית שמתחברת ל-OpenAI
async function getRealAIResponse(prompt, category, subCategory) {
    try {
        const fullPrompt = `
        אתה מורה מומחה. תכין שיעור קצר ומעניין על הנושא הבא:
        
        קטגוריה: ${category}
        תת-קטגוריה: ${subCategory}
        השאלה/הנושא: ${prompt}
        
        אנא כתב שיעור בן 2-3 פסקאות שיהיה:
        1. מעניין וקל להבנה
        2. עם עובדות מעניינות
        3. בעברית ברורה
        `;

        const response = await openai.chat.completions.create({
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

        return response.choices[0].message.content;
    } catch (error) {
        console.error("שגיאה בחיבור ל-OpenAI:", error);
        // אם יש בעיה - נחזיר תשובה מזויפת
        return getMockAIResponse(prompt, category, subCategory);
    }
}

// פונקציית גיבוי אם יש בעיה עם OpenAI
function getMockAIResponse(prompt, category = "כללי", subCategory = "כללי") {
    return `
🎓 **שיעור על: ${prompt}**

זהו שיעור שנוצר על ידי מערכת הגיבוי. במערכת האמיתית, כאן היה מופיע שיעור מפורט שנוצר על ידי ChatGPT.

**נושא:** ${category} - ${subCategory}

לדוגמה: אם שאלת על חורים שחורים, הייתי מסביר איך הם נוצרים מכוכבים מאסיביים שקורסים, ומה קורה לחומר שנופל לתוכם.

זוהי תשובה זמנית שמראה את פונקציונליות המערכת! 🚀
    `;
}

// פונקציה ראשית
async function generateLesson(prompt, category = "כללי", subCategory = "כללי") {
    // בדיקה אם יש מפתח API
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
        console.log("🤖 משתמש ב-OpenAI האמיתי");
        return await getRealAIResponse(prompt, category, subCategory);
    } else {
        console.log("🎭 משתמש בתשובה מזויפת");
        return getMockAIResponse(prompt, category, subCategory);
    }
}

module.exports = { generateLesson };
