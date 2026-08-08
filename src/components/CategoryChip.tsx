import { getCategory } from '../lib/categories';
import './CategoryChip.css';

interface Props {
  category: string;
  size?: 'sm' | 'md';
}

export default function CategoryChip({ category, size = 'md' }: Props) {
  const cat = getCategory(category);
  return (
    <span
      className={`category-chip category-chip--${size}`}
      style={{ background: cat.bg, color: cat.color }}
    >
      <span className="category-chip__icon">{cat.icon}</span>
      <span className="category-chip__label">{cat.label}</span>
    </span>
  );
}
