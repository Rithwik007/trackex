import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sheetVariants, tapScale } from '../lib/animations';
import CategoryPicker from './CategoryPicker';
import type { CategoryId } from '../lib/categories';
import { getAuth } from '../lib/auth';
import './AddExpenseSheet.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editExpense?: { _id: string; type?: 'expense' | 'income'; amount: number; category: string; note: string; date: string } | null;
}

export default function AddExpenseSheet({ open, onClose, onSaved, editExpense }: Props) {
  const [type, setType]         = useState<'expense' | 'income'>('expense');
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (editExpense) {
      setType(editExpense.type ?? 'expense');
      setAmount(editExpense.amount?.toString() ?? '');
      setCategory(editExpense.category as CategoryId ?? '');
      setNote(editExpense.note ?? '');
      setDate(editExpense.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    } else {
      reset();
    }
  }, [editExpense, open]);

  const reset = () => {
    setType('expense');
    setAmount('');
    setCategory('');
    setNote('');
    setDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Enter a valid amount > 0'); return; }
    if (!category) { setError('Pick a category'); return; }

    const auth = getAuth();
    if (!auth) return;

    setSaving(true); setError('');
    try {
      const url    = editExpense ? `/api/expenses/${editExpense._id}` : '/api/expenses';
      const method = editExpense ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': auth.user_id,
          'x-token':   auth.token,
        },
        body: JSON.stringify({ type, amount: amt, category, note: note.trim(), date }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Save failed');
      }
      reset(); onSaved(); onClose();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            className="add-expense-sheet"
            variants={sheetVariants}
            initial="hidden" animate="visible" exit="exit"
            role="dialog"
            aria-label={editExpense ? 'Edit transaction' : 'Add transaction'}
          >
            <div className="sheet-handle" />

            <div className="sheet-header">
              <h2 className="sheet-title">{editExpense ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <motion.button
                className="sheet-close" onClick={handleClose}
                whileTap={tapScale} aria-label="Close"
              >✕</motion.button>
            </div>

            {/* Type Segment Control */}
            <div className="sheet-type-toggle">
              <button
                type="button"
                className={`sheet-type-btn ${type === 'expense' ? 'active active--expense' : ''}`}
                onClick={() => {
                  if (type !== 'expense') {
                    setType('expense');
                    setCategory('');
                  }
                }}
              >
                − Expense
              </button>
              <button
                type="button"
                className={`sheet-type-btn ${type === 'income' ? 'active active--income' : ''}`}
                onClick={() => {
                  if (type !== 'income') {
                    setType('income');
                    setCategory('');
                  }
                }}
              >
                + Income / Funds
              </button>
            </div>

            {/* Amount */}
            <div className="sheet-field">
              <label className="sheet-label">Amount (₹)</label>
              <div className="sheet-amount-wrap">
                <span className="sheet-amount-prefix mono">₹</span>
                <input
                  id="expense-amount"
                  className="sheet-amount-input mono"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  min="0.01"
                  step="0.01"
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Category */}
            <div className="sheet-field">
              <label className="sheet-label">Category</label>
              <CategoryPicker type={type} selected={category} onSelect={setCategory} />
            </div>

            {/* Note */}
            <div className="sheet-field">
              <label className="sheet-label" htmlFor="expense-note">Description / Note (optional)</label>
              <input
                id="expense-note"
                className="sheet-input"
                type="text"
                placeholder={type === 'income' ? 'e.g. Salary credited' : 'e.g. Coffee with friends'}
                value={note}
                maxLength={120}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="sheet-field">
              <label className="sheet-label" htmlFor="expense-date">Date</label>
              <input
                id="expense-date"
                className="sheet-input"
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {error && <p className="sheet-error">{error}</p>}

            <motion.button
              id="save-expense-btn"
              className={`sheet-save-btn ${saving ? 'saving' : ''}`}
              onClick={handleSave}
              whileTap={tapScale}
              disabled={saving}
              style={{ background: type === 'income' ? 'var(--accent)' : 'var(--accent)' }}
            >
              {saving ? <span className="sheet-spinner" /> : null}
              {saving ? 'Saving…' : editExpense ? 'Update Transaction' : type === 'income' ? 'Add Income 🚀' : 'Save Expense 💸'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
