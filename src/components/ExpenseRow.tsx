import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef } from 'react';
import CategoryChip from './CategoryChip';
import { tapScale } from '../lib/animations';
import './ExpenseRow.css';

export interface Expense {
  _id: string;
  type?: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: string;
  created_at: string;
}

interface Props {
  expense: Expense;
  onDelete: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export default function ExpenseRow({ expense, onDelete, onEdit }: Props) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40], [1, 0]);
  const rowOpacity = useTransform(x, [-120, -80], [0.6, 1]);
  const isDragging = useRef(false);

  const handleDragEnd = () => {
    if (x.get() < -80) {
      animate(x, -120, { duration: 0.15 });
      setTimeout(() => onDelete(expense._id), 200);
    } else {
      animate(x, 0, { type: 'spring', damping: 26, stiffness: 300 });
    }
  };

  const dateStr = new Date(expense.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });

  const isIncome = expense.type === 'income';

  return (
    <div className="expense-row-wrap">
      {/* Red delete background */}
      <motion.div className="expense-row__delete-bg" style={{ opacity: deleteOpacity }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
        <span>Delete</span>
      </motion.div>

      <motion.div
        className="expense-row card"
        style={{ x, opacity: rowOpacity }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={handleDragEnd}
        whileTap={onEdit ? tapScale : undefined}
        onClick={() => {
          if (!isDragging.current && onEdit) onEdit(expense);
          isDragging.current = false;
        }}
      >
        <div className="expense-row__left">
          <CategoryChip category={expense.category} size="sm" />
          <div className="expense-row__meta">
            {expense.note
              ? <span className="expense-row__note">{expense.note}</span>
              : <span className="expense-row__note expense-row__note--empty">{expense.category}</span>
            }
            <span className="expense-row__date">{dateStr}</span>
          </div>
        </div>
        <span
          className="expense-row__amount mono"
          style={{ color: isIncome ? 'var(--accent)' : 'var(--danger)' }}
        >
          {isIncome ? '+' : '−'}₹{expense.amount.toFixed(2)}
        </span>
      </motion.div>
    </div>
  );
}
