import React, { useEffect, useRef, useState } from 'react';
import api from '../api/api';
import '../styles/ragChatWidget.css';

function RagChatWidget({ currentUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const toggleWidget = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!query.trim()) {
            return;
        }

        const userMessage = { role: 'user', text: query.trim() };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setQuery('');
        setError('');
        setIsSending(true);

        try {
            const response = await api.post('/rag/ask', { query: userMessage.text });
            setMessages((prev) => [...prev, { role: 'assistant', text: response.data.answer, fallback: response.data.fallback }]);
        } catch (err) {
            console.error('RAG chat error:', err);
            setError(err.response?.data?.error || 'לא ניתן היה לשלוח את השאלה כרגע.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="rag-chat-widget">
            <button type="button" className="rag-chat-fab" onClick={toggleWidget} aria-label="פתח צ'אט תמיכה">
                💬
            </button>

            {isOpen && (
                <div className="rag-chat-panel">
                    <div className="rag-chat-header">
                        <div>
                            <h3>עוזר תמיכה חכם</h3>
                            <p>שאל על קורסים, קטגוריות ומידע באתר.</p>
                        </div>
                        <button type="button" className="rag-chat-close" onClick={toggleWidget}>×</button>
                    </div>

                    <div className="rag-chat-messages">
                        {messages.length === 0 ? (
                            <div className="rag-chat-empty">
                                <p>אפשר לשאול למשל: "איך נרשמים לקורס?" או "מה כוללת קטגוריית טכנולוגיה?"</p>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div key={`${message.role}-${index}`} className={`rag-chat-bubble ${message.role}`}>
                                    {message.text}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {error && <div className="rag-chat-error">{error}</div>}

                    <form className="rag-chat-form" onSubmit={handleSubmit}>
                        <textarea
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="כתוב את השאלה שלך..."
                            rows="3"
                        />
                        <button type="submit" disabled={isSending}>
                            {isSending ? 'שולח...' : 'שלח'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default RagChatWidget;
