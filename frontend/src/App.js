import './App.css';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './Route';

function App() {
    return (
        <Router>
            <div className="App">
                <AppRouter />
            </div>
        </Router>
    );
}

export default App;