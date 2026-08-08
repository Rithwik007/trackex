import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './BalanceCard.css';

interface Props {
  balance: number;
  totalSpent: number;
  totalIncome?: number;
  name: string;
  loading?: boolean;
}

export default function BalanceCard({ balance, totalSpent, totalIncome = 0, name, loading }: Props) {
  const [displayVal, setDisplayVal] = useState(balance);
  const prevBalRef = useRef(balance);

  useEffect(() => {
    if (loading) return;
    const startVal = prevBalRef.current;
    const endVal = balance;
    
    if (startVal === endVal) {
      setDisplayVal(endVal);
      return;
    }

    const duration = 600;
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (endVal - startVal) * easeProgress;
      
      setDisplayVal(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        prevBalRef.current = endVal;
      }
    };

    const animId = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(animId);
  }, [balance, loading]);

  const negative = balance < 0;

  return (
    <motion.div
      className={`balance-card card glow-accent ${negative ? 'balance-card--negative' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="balance-card__header">
        <span className="balance-card__greeting">Hey, {name} 👋</span>
        <span className="balance-card__label">Current Balance</span>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 48, width: '60%', marginTop: 8 }} />
      ) : (
        <div className="balance-card__amount">
          <span className="balance-card__currency mono">₹</span>
          <span className={`balance-card__value mono ${negative ? 'negative' : ''}`}>
            {displayVal.toFixed(2)}
          </span>
          {negative && <span className="balance-card__badge">Overdrawn</span>}
        </div>
      )}

      <div className="balance-card__footer">
        <div className="balance-card__stat">
          <span className="balance-card__stat-label">Income</span>
          <span className="balance-card__stat-value mono" style={{ color: 'var(--accent)' }}>
            +₹{totalIncome.toFixed(2)}
          </span>
        </div>
        <div className="balance-card__divider" />
        <div className="balance-card__stat">
          <span className="balance-card__stat-label">Spent</span>
          <span className="balance-card__stat-value mono" style={{ color: 'var(--danger)' }}>
            −₹{totalSpent.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
