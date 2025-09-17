// נתונים שנשמרים בזיכרון (במקום מסד נתונים אמיתי)
let users = [
    {id: 1, name: "תמי", phone: "050-1234567"},
    {id: 2, name: "יוסי", phone: "052-7654321"}
];

let categories = [
    {id: 1, name: "מדעים"},
    {id: 2, name: "היסטוריה"}, 
    {id: 3, name: "טכנולוגיה"},
    {id: 4, name: "אמנות"}
];

let subCategories = [
    {id: 1, name: "חלל ואסטרונומיה", category_id: 1},
    {id: 2, name: "פיזיקה", category_id: 1},
    {id: 3, name: "כימיה", category_id: 1},
    {id: 4, name: "מלחמת העולם השנייה", category_id: 2},
    {id: 5, name: "העת העתיקה", category_id: 2},
    {id: 6, name: "בינה מלאכותית", category_id: 3},
    {id: 7, name: "פיתוח אפליקציות", category_id: 3},
    {id: 8, name: "ציור", category_id: 4},
    {id: 9, name: "מוזיקה", category_id: 4}
];

let prompts = [];

// פונקציות לעבודה עם הנתונים
const database = {
    // פעולות על משתמשים
    users: {
        getAll: () => users,
        getById: (id) => users.find(u => u.id == id),
        create: (userData) => {
            const newUser = {
                id: users.length + 1,
                ...userData
            };
            users.push(newUser);
            return newUser;
        }
    },

    // פעולות על קטגוריות
    categories: {
        getAll: () => categories
    },

    // פעולות על תת-קטגוריות
    subCategories: {
        getAll: () => subCategories,
        getByCategory: (categoryId) => subCategories.filter(sc => sc.category_id == categoryId)
    },

    // פעולות על פרומפטים (היסטוריית לימוד)
    prompts: {
        getAll: () => prompts,
        getByUser: (userId) => prompts.filter(p => p.user_id == userId),
        create: (promptData) => {
            const newPrompt = {
                id: prompts.length + 1,
                ...promptData,
                created_at: new Date().toISOString()
            };
            prompts.push(newPrompt);
            return newPrompt;
        }
    }
};

module.exports = database;