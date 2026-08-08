import { motion } from 'framer-motion';
import { CATEGORIES, INCOME_CATEGORIES } from '../lib/categories';
import type { CategoryId } from '../lib/categories';
import { tapScale } from '../lib/animations';
import './CategoryPicker.css';

interface Props {
  type?: 'expense' | 'income';
  selected: CategoryId | '';
  onSelect: (id: CategoryId) => void;
}

export default function CategoryPicker({ type = 'expense', selected, onSelect }: Props) {
  const categoryList = type === 'income' ? INCOME_CATEGORIES : CATEGORIES;

  return (
    <div className="category-picker" role="radiogroup" aria-label="Transaction category">
      {categoryList.map((cat) => {
        const active = selected === cat.id;
        return (
          <motion.button
            key={cat.id}
            id={`cat-${cat.id.toLowerCase().replace(/\s+/g, '-')}`}
            className={`category-picker__item ${active ? 'active' : ''}`}
            style={active ? { background: cat.bg, borderColor: cat.color, color: cat.color } : {}}
            onClick={() => onSelect(cat.id as CategoryId)}
            whileTap={tapScale}
            animate={{ scale: active ? 1.05 : 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            role="radio"
            aria-checked={active}
          >
            <span className="category-picker__icon">{cat.icon}</span>
            <span className="category-picker__label">{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
