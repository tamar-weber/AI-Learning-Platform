const { generateLesson } = require('../models/aiService');
const { categories, subCategories } = require('../models/categoryService');
const historyService = require('../models/historyService');
const AppError = require('../utils/appError');

function resolveCategoryNames(body) {
    let categoryName = 'כללי';
    let subCategoryName = '';

    if (body.categoryId && body.categoryId !== 'other') {
        const category = categories.find((item) => item.id === Number(body.categoryId));
        if (category) {
            categoryName = category.name;
        }
    } else if (body.customCategory) {
        categoryName = body.customCategory;
    }

    if (body.subCategoryId && body.subCategoryId !== 'other') {
        const subCategory = subCategories.find((item) => item.id === Number(body.subCategoryId));
        if (subCategory) {
            subCategoryName = subCategory.name;
        }
    } else if (body.customSubCategory) {
        subCategoryName = body.customSubCategory;
    }

    return { categoryName, subCategoryName };
}

async function generateLessonHandler(req, res, next) {
    try {
        const { prompt, userId } = req.body;

        if (!prompt || !userId) {
            throw new AppError('חסרים נתונים נדרשים: prompt ו-userId', 400);
        }

        const { categoryName, subCategoryName } = resolveCategoryNames(req.body);
        const lesson = await generateLesson(prompt, categoryName, subCategoryName);

        await historyService.addHistory({
            userId,
            prompt,
            category: categoryName,
            subCategory: subCategoryName,
            response: lesson
        });

        res.json({
            success: true,
            lesson,
            prompt
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    generateLesson: generateLessonHandler
};
