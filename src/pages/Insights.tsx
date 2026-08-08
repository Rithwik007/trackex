import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../lib/api';
import { pageTransition, tapScale } from '../lib/animations';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import './Insights.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface QueryResponse {
  answer: string;
  value?: number;
  count?: number;
  understood: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "Hey! Ask me any question about your spending, like: 'how much did I spend on food this week?' or 'what's my average shopping expense?'",
};

export default function Insights() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('trackex_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [WELCOME_MESSAGE];
  });
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('trackex_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    localStorage.removeItem('trackex_chat_history');
    setConfirmingClear(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim();
    if (!clean || loading) return;

    setInput('');
    const userMsg: Message = { id: Math.random().toString(), role: 'user', text: clean };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // Prepare chat history payload for backend (exclude the welcome message to be clean, map role/content)
    const chatHistoryPayload = updatedMessages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role,
        content: m.text,
      }));

    try {
      const res = await apiPost<QueryResponse>('/api/query', {
        question: clean,
        chat_history: chatHistoryPayload,
      });
      const botMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        text: res.answer,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        text: "Sorry, I couldn't reach the server. Please check your connection and try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <motion.div
      className="insights"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="insights__header">
        <div className="insights__header-text">
          <h1 className="insights__title">Insights Chat</h1>
          <p className="insights__subtitle">Powered by Groq LLM</p>
        </div>
        {messages.length > 1 && (
          <div className="insights__clear-btn-wrap">
            {confirmingClear ? (
              <>
                <button
                  className="insights__clear-cancel-btn"
                  onClick={() => setConfirmingClear(false)}
                >
                  Cancel
                </button>
                <motion.button
                  className="insights__clear-confirm-btn"
                  onClick={handleClear}
                  whileTap={tapScale}
                >
                  Confirm Clear
                </motion.button>
              </>
            ) : (
              <motion.button
                className="insights__clear-btn"
                onClick={() => setConfirmingClear(true)}
                whileTap={tapScale}
                aria-label="Clear chat"
              >
                Clear Chat
              </motion.button>
            )}
          </div>
        )}
      </div>

      <div className="insights__thread">
        <div className="insights__thread-inner">
          <AnimatePresence initial={false}>
            {messages.map(m => (
              <ChatBubble key={m.id} role={m.role} text={m.text} />
            ))}
            {loading && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={threadEndRef} />
        </div>
      </div>

      <form className="insights__input-area" onSubmit={handleSend}>
        <div className="insights__input-wrap">
          <input
            ref={inputRef}
            id="insights-input"
            className="insights__input"
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
          <motion.button
            id="insights-send-btn"
            className="insights__send-btn"
            type="submit"
            disabled={!input.trim() || loading}
            whileTap={tapScale}
            aria-label="Send query"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
