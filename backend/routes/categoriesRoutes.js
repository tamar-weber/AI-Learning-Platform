const express = require('express');
const router = express.Router();
const categoryService = require('../models/categoryService');

router.get('/', (req, res) => {
    res.json(categoryService.getCategories());
});

router.get('/subcategories/:categoryId', (req, res) => {
    const subCategories = categoryService.getSubCategoriesByCategoryId(req.params.categoryId);
    res.json(subCategories);
});

module.exports = router;
