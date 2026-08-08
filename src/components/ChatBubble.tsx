import { motion } from 'framer-motion';
import { slideUp } from '../lib/animations';
import './ChatBubble.css';

interface Props {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatBubble({ role, text }: Props) {
  return (
    <motion.div
      className={`chat-bubble chat-bubble--${role}`}
      variants={slideUp}
      initial="hidden"
      animate="show"
    >
      <span className="chat-bubble__label">
        {role === 'user' ? 'You' : 'TrackEx Assistant'}
      </span>
      <p className="chat-bubble__text">{text}</p>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      className="chat-bubble chat-bubble--assistant"
      variants={slideUp}
      initial="hidden"
      animate="show"
    >
      <span className="chat-bubble__label">TrackEx Assistant</span>
      <div className="typing-indicator">
        <span /><span /><span />
      </div>
    </motion.div>
  );
}
