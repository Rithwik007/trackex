import { motion } from 'framer-motion';
import './EmptyState.css';

interface Props {
  title?: string;
  message?: string;
  cta?: string;
  onCta?: () => void;
}

export default function EmptyState({
  title = 'No expenses yet',
  message = 'Start logging to see your spending here.',
  cta = 'Log Your First Expense',
  onCta,
}: Props) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="empty-state__icon">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="9" y2="15" />
          <line x1="12" y1="15" x2="15" y2="15" />
        </svg>
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__message">{message}</p>
      {onCta && (
        <button
          id="empty-state-cta"
          className="empty-state__cta pulse-glow"
          onClick={onCta}
        >
          {cta}
        </button>
      )}
    </motion.div>
  );
}
