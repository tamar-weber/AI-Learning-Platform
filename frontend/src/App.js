import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// ייבוא של כל העמודים (נצטרך ליצור אותם)
// import RegisterPage from './pages/RegisterPage';
// import SelectTopicPage from './pages/SelectTopicPage';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>🎓 AI Learning Platform</h1>
        
        {/* בינתיים נציג הודעה פשוטה */}
        <div style={{padding: '20px', textAlign: 'center'}}>
          <p>הפלטפורמה בבנייה... 🚧</p>
          <p>בקרוב נוכל לבחור נושאי למידה ולקבל שיעורים מה-AI!</p>
        </div>

        {/* מאוחר יותר נוסיף כאן את כל הRoutes */}
        {/* 
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/select-topic" element={<SelectTopicPage />} />
        </Routes>
        */}
      </div>
    </Router>
  );
}

export default App;