import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/learningPage.css';

function LearningPage({ currentUser }) {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [customSubCategory, setCustomSubCategory] = useState('');
    const [prompt, setPrompt] = useState('');
    const [lesson, setLesson] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // טעינת קטגוריות כשהעמוד נטען
    useEffect(() => {
        api.get('/categories')
            .then(response => setCategories(response.data))
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    // טעינת תת-קטגוריות כשבוחרים קטגוריה ראשית
    useEffect(() => {
        if (selectedCategory && selectedCategory !== 'other') {
            api.get(`/categories/subcategories/${selectedCategory}`)
                .then(response => setSubCategories(response.data))
                .catch(err => console.error("Error fetching sub-categories:", err));
        } else {
            setSubCategories([]);
        }
        setSelectedSubCategory('');
    }, [selectedCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isCustomCategory = selectedCategory === 'other' && !customCategory.trim();
        const isCustomSubCategory = selectedSubCategory === 'other' && !customSubCategory.trim();

        if (!prompt.trim() || !selectedCategory || isCustomCategory || isCustomSubCategory) {
            setError('אנא בחר קטגוריה/תת-קטגוריה תקינה ומלא שאלה.');
            return;
        }

        setIsLoading(true);
        setError('');
        setLesson(null);

        try {
            const requestBody = {
                prompt: prompt.trim(),
                userId: currentUser._id,
                categoryId: selectedCategory,
                subCategoryId: selectedSubCategory,
                customCategory: selectedCategory === 'other' ? customCategory.trim() : '',
                customSubCategory: selectedSubCategory === 'other' ? customSubCategory.trim() : ''
            };
            
            const response = await api.post('/generate-lesson', requestBody);
            setLesson(response.data.lesson);
        } catch (err) {
            console.error("שגיאה ביצירת שיעור:", err);
            setError('אופס, קרתה שגיאה ביצירת השיעור. ייתכן שיש בעיה עם מפתח ה-API או החיבור לשרת.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!currentUser) {
        return (
            <div className="learning-guest">
                <h2>נא להתחבר למערכת כדי ליצור שיעור.</h2>
                <button onClick={() => navigate('/login')}>מעבר לעמוד הכניסה</button>
            </div>
        );
    }

    return (
        <div className="learning-page">
            <div className="learning-header">
                <h2>שלום, {currentUser.name}!</h2>
            </div>

            <h1 className="learning-title">📝 יצירת שיעור חדש</h1>

            <form onSubmit={handleSubmit} className="learning-form">
                <div>
                    <label className="learning-label">קטגוריה:</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="learning-select">
                        <option value="">בחר קטגוריה...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        <option value="other">אחר (נא לפרט)</option>
                    </select>
                </div>

                {selectedCategory === 'other' && (
                    <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="כתוב את הקטגוריה שלך" className="learning-input" />
                )}

                {(subCategories.length > 0 || selectedCategory === 'other') && (
                    <div>
                        <label className="learning-label">תת-קטגוריה:</label>
                        <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="learning-select" disabled={!selectedCategory}>
                            <option value="">בחר תת-קטגוריה (אופציונלי)</option>
                            {subCategories.map(subCat => (
                                <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                            ))}
                            <option value="other">אחר (נא לפרט)</option>
                        </select>
                    </div>
                )}

                {selectedSubCategory === 'other' && (
                    <input type="text" value={customSubCategory} onChange={e => setCustomSubCategory(e.target.value)} placeholder="כתוב את תת-הקטגוריה שלך" className="learning-input" />
                )}

                <div>
                    <label className="learning-label">מה תרצה ללמוד היום?</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="לדוגמה: למד אותי על חורים שחורים" rows="4" className="learning-textarea" />
                </div>

                <button type="submit" disabled={isLoading} className="learning-submit-button">
                    {isLoading ? 'יוצר שיעור...' : 'שלח ל-AI 🚀'}
                </button>
            </form>

            {error && <p className="learning-error">❌ {error}</p>}
            {isLoading && <p className="learning-loading">טוען... אנא המתן, ה-AI חושב 🧠</p>}

            {lesson && (
                <div className="learning-result">
                    <h3 className="learning-result-title">🎯 השיעור שלך מוכן!</h3>
                    <div className="learning-result-content">{lesson}</div>
                </div>
            )}
        </div>
    );
}

export default LearningPage;
