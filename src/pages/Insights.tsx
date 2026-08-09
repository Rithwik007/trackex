import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost, apiDelete } from '../lib/api';
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
    const cached = localStorage.getItem('trackex_chat_history');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [WELCOME_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chat history from MongoDB on mount to sync cloud state.
  // Only overwrite local state if cloud has MORE messages (e.g. from another device).
  // Never downgrade — local state may contain messages not yet persisted to MongoDB.
  useEffect(() => {
    apiGet<{ messages: Message[] }>('/api/chat')
      .then(res => {
        if (res.messages && res.messages.length > 0) {
          const synced = [WELCOME_MESSAGE, ...res.messages];
          // Only apply cloud data if it has more messages than local cache
          setMessages(prev => {
            const localCount = prev.filter(m => m.id !== 'welcome').length;
            const cloudCount = res.messages.length;
            if (cloudCount >= localCount) {
              localStorage.setItem('trackex_chat_history', JSON.stringify(synced));
              return synced;
            }
            return prev;
          });
        }
      })
      .catch(err => console.error('[Chat History Fetch Error]', err))
      .finally(() => setFetchingHistory(false));
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('trackex_chat_history', JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && !fetchingHistory) {
      inputRef.current?.focus();
    }
  }, [loading, fetchingHistory]);

  const handleClear = async () => {
    try {
      await apiDelete('/api/chat');
      setMessages([WELCOME_MESSAGE]);
      localStorage.removeItem('trackex_chat_history');
      setConfirmingClear(false);
    } catch {
      alert('Failed to clear chat history from server.');
    }
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
          <span className="insights__subtitle">Powered by AI • Cloud Synced</span>
        </div>

        {messages.length > 1 && (
          <div className="insights__clear-btn-wrap">
            {confirmingClear ? (
              <>
                <button className="insights__clear-confirm-btn" onClick={handleClear}>
                  Confirm Clear
                </button>
                <button
                  className="insights__clear-cancel-btn"
                  onClick={() => setConfirmingClear(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="insights__clear-btn"
                onClick={() => setConfirmingClear(true)}
              >
                Clear Thread
              </button>
            )}
          </div>
        )}
      </div>

      <div className="insights__thread">
        <div className="insights__thread-inner">
          {fetchingHistory ? (
            <div className="insights__loading-history card" style={{ padding: 16, textAlign: 'center' }}>
              <span className="text-muted" style={{ fontSize: 13 }}>Syncing chat history from cloud...</span>
            </div>
          ) : (
            messages.map(m => <ChatBubble key={m.id} role={m.role} text={m.text} />)
          )}
          {loading && <TypingIndicator />}
          <div ref={threadEndRef} />
        </div>
      </div>

      <div className="insights__input-area">
        <form className="insights__input-wrap" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            className="insights__input"
            placeholder="Ask anything about your spending..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || fetchingHistory}
          />
          <motion.button
            type="submit"
            className="insights__send-btn"
            disabled={!input.trim() || loading || fetchingHistory}
            whileTap={tapScale}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
