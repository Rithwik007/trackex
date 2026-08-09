import React from 'react';
import { motion } from 'framer-motion';
import { tapScale } from '../lib/animations';
import './MonthSelector.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthSelectorProps {
  year: number;
  month: number; // 1-indexed (1 = Jan, 12 = Dec)
  onChange: (year: number, month: number) => void;
}

export default function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isCurrentMonth = year === currentYear && month === currentMonth;

  const handlePrev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (isCurrentMonth) return; // Prevent selecting future months
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  return (
    <div className="month-selector">
      <motion.button
        className="month-selector__btn"
        onClick={handlePrev}
        whileTap={tapScale}
        aria-label="Previous month"
      >
        ‹
      </motion.button>
      <div className="month-selector__label">
        <span className="month-selector__text">{MONTH_NAMES[month - 1]} {year}</span>
      </div>
      <motion.button
        className={`month-selector__btn ${isCurrentMonth ? 'disabled' : ''}`}
        onClick={handleNext}
        disabled={isCurrentMonth}
        whileTap={isCurrentMonth ? undefined : tapScale}
        aria-label="Next month"
      >
        ›
      </motion.button>
    </div>
  );
}
