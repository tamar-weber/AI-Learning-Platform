import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

function LearningPage({ currentUser, onLogout }) {
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
        axios.get(`${API_URL}/categories`)
            .then(response => setCategories(response.data))
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    // טעינת תת-קטגוריות כשבוחרים קטגוריה ראשית
    useEffect(() => {
        if (selectedCategory && selectedCategory !== 'other') {
            axios.get(`${API_URL}/categories/subcategories/${selectedCategory}`)
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
        if (!prompt.trim() || (!selectedCategory || isCustomCategory)) {
            setError('אנא בחר קטגוריה (או כתוב אחת) ומלא שאלה.');
            return;
        }

        setIsLoading(true);
        setError('');
        setLesson(null);

        try {
            const requestBody = {
                prompt: prompt.trim(),
                user_id: currentUser._id,
                category_id: selectedCategory,
                sub_category_id: selectedSubCategory,
                custom_category: selectedCategory === 'other' ? customCategory : '',
                custom_sub_category: selectedSubCategory === 'other' ? customSubCategory : '',
            };
            
            const response = await axios.post(`${API_URL}/generate-lesson`, requestBody);
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
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>נא להתחבר למערכת כדי ליצור שיעור.</h2>
                <button onClick={() => navigate('/login')}>מעבר לעמוד הכניסה</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>שלום, {currentUser.name}!</h2>
                <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>התנתק</button>
            </div>
            
            <h1 style={{ textAlign: 'center' }}>📝 יצירת שיעור חדש</h1>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '10px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>קטגוריה:</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '16px' }}>
                        <option value="">בחר קטגוריה...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        <option value="other">אחר (נא לפרט)</option>
                    </select>
                </div>

                {selectedCategory === 'other' && (
                    <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="כתוב את הקטגוריה שלך" style={{ width: '100%', padding: '12px' }}/>
                )}

                {(subCategories.length > 0 || selectedCategory === 'other') && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>תת-קטגוריה:</label>
                        <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '16px' }} disabled={!selectedCategory}>
                            <option value="">בחר תת-קטגוריה (אופציונלי)</option>
                            {subCategories.map(subCat => (
                                <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                            ))}
                            <option value="other">אחר (נא לפרט)</option>
                        </select>
                    </div>
                )}

                {selectedSubCategory === 'other' && (
                    <input type="text" value={customSubCategory} onChange={e => setCustomSubCategory(e.target.value)} placeholder="כתוב את תת-הקטגוריה שלך" style={{ width: '100%', padding: '12px' }}/>
                )}
                
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>מה תרצה ללמוד היום?</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="לדוגמה: למד אותי על חורים שחורים" rows="4" style={{ width: '100%', padding: '12px', fontSize: '16px' }}/>
                </div>

                <button type="submit" disabled={isLoading} style={{ padding: '15px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none' }}>
                    {isLoading ? 'יוצר שיעור...' : 'שלח ל-AI 🚀'}
                </button>
            </form>
            
            {error && <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>❌ {error}</p>}
            
            {isLoading && <p style={{ textAlign: 'center', fontSize: '18px' }}>טוען... אנא המתן, ה-AI חושב 🧠</p>}

            {lesson && (
                <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
                    <h3 style={{ textAlign: 'center' }}>🎯 השיעור שלך מוכן!</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{lesson}</div>
                </div>
            )}
        </div>
    );
}

export default LearningPage;
