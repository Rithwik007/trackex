export type ExpenseCategoryId = 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'Entertainment' | 'Other';
export type IncomeCategoryId = 'Salary' | 'Allowance' | 'Cash Added' | 'Refund' | 'Cashback' | 'Gift' | 'Other';
export type CategoryId = ExpenseCategoryId | IncomeCategoryId;

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const CATEGORIES: Category[] = [
  { id: 'Food',          label: 'Food',          icon: '🍜', color: '#00D9A3', bg: 'rgba(0,217,163,0.12)' },
  { id: 'Transport',     label: 'Transport',     icon: '🚗', color: '#4DA6FF', bg: 'rgba(77,166,255,0.12)' },
  { id: 'Bills',         label: 'Bills',         icon: '⚡', color: '#FFB347', bg: 'rgba(255,179,71,0.12)' },
  { id: 'Shopping',      label: 'Shopping',      icon: '🛍️', color: '#C77DFF', bg: 'rgba(199,125,255,0.12)' },
  { id: 'Entertainment', label: 'Entertainment', icon: '🎮', color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
  { id: 'Other',         label: 'Other',         icon: '📌', color: '#8A8A93', bg: 'rgba(138,138,147,0.12)' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'Salary',     label: 'Salary',     icon: '💼', color: '#00D9A3', bg: 'rgba(0,217,163,0.12)' },
  { id: 'Allowance',  label: 'Allowance',  icon: '💵', color: '#4DA6FF', bg: 'rgba(77,166,255,0.12)' },
  { id: 'Cash Added', label: 'Cash Added', icon: '🏦', color: '#FFB347', bg: 'rgba(255,179,71,0.12)' },
  { id: 'Refund',     label: 'Refund',     icon: '🔄', color: '#C77DFF', bg: 'rgba(199,125,255,0.12)' },
  { id: 'Cashback',   label: 'Cashback',   icon: '🎁', color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
  { id: 'Gift',       label: 'Gift',       icon: '🎉', color: '#FFD166', bg: 'rgba(255,209,102,0.12)' },
  { id: 'Other',      label: 'Other',      icon: '📌', color: '#8A8A93', bg: 'rgba(138,138,147,0.12)' },
];

export const ALL_CATEGORIES = [...CATEGORIES, ...INCOME_CATEGORIES];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  ALL_CATEGORIES.map(c => [c.id, c])
);

export function getCategory(id: string): Category {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP['Other'];
}
