import React from 'react';

function formatTime(ts) {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

export default function ChatbotWidget({ user }) {
    const [open, setOpen] = React.useState(false);
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [convId, setConvId] = React.useState(null);
    const [error, setError] = React.useState('');
    const messagesEndRef = React.useRef(null);
    const inputRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        if (open) {
            setTimeout(scrollToBottom, 100);
            inputRef.current?.focus();
        }
    }, [open, messages]);

    React.useEffect(() => {
        setMessages([]);
        setConvId(null);
        setError('');
    }, [user]);

    async function handleSend() {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setError('');

        setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);
        setLoading(true);

        try {
            const res = await window.axios.post('/api/v1/chatbot/chat', {
                message: text,
                conversation_id: convId,
            });

            setConvId(res.data.conversation_id);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: res.data.response, timestamp: new Date().toISOString() },
            ]);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Could not get response. Please try again.';
            setError(msg);
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleNew() {
        setMessages([]);
        setConvId(null);
        setError('');
    }

    return (
        <div className="chatbot-widget">
            {!open && (
                <button className="chatbot-bubble" onClick={() => setOpen(true)} title="AI Assistant">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <line x1="9" y1="10" x2="15" y2="10" />
                        <line x1="12" y1="7" x2="12" y2="13" />
                    </svg>
                </button>
            )}

            {open && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-header-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.73-4H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="chatbot-header-title">AI Assistant</div>
                                <div className="chatbot-header-sub">Ask about the platform</div>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button className="chatbot-header-btn" onClick={handleNew} title="New conversation">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                            <button className="chatbot-header-btn" onClick={() => setOpen(false)} title="Close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div className="chatbot-empty">
                                <div className="chatbot-empty-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                                <div className="chatbot-empty-title">Hi, I'm your AI Assistant!</div>
                                <div className="chatbot-empty-sub">
                                    Ask me about scholarships, platform features, connecting with alumni, or finding jobs.
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`chatbot-msg ${msg.role === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-bot'}`}>
                                {msg.role !== 'user' && (
                                    <div className="chatbot-msg-avatar">AI</div>
                                )}
                                <div className="chatbot-msg-content">
                                    <div className="chatbot-msg-text">{msg.content}</div>
                                    <div className="chatbot-msg-time">{formatTime(msg.timestamp)}</div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="chatbot-msg chatbot-msg-bot">
                                <div className="chatbot-msg-avatar">AI</div>
                                <div className="chatbot-msg-content">
                                    <div className="chatbot-typing">
                                        <span className="chatbot-typing-dot" />
                                        <span className="chatbot-typing-dot" />
                                        <span className="chatbot-typing-dot" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="chatbot-error">{error}</div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-input-area">
                        <input
                            ref={inputRef}
                            className="chatbot-input"
                            type="text"
                            placeholder="Type your question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
