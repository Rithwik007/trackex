import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiDelete } from '../lib/api';
import { pageTransition, listContainer, listItem, tapScale } from '../lib/animations';
import ExpenseRow from '../components/ExpenseRow';
import type { Expense } from '../components/ExpenseRow';
import AddExpenseSheet from '../components/AddExpenseSheet';
import EmptyState from '../components/EmptyState';
import './History.css';

interface HistoryResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function History() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editExp, setEditExp]   = useState<Expense | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiGet<HistoryResponse>(`/api/expenses?page=${p}&limit=15`);
      setExpenses(res.expenses);
      setTotalPages(res.pagination.pages);
      setPage(res.pagination.page);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/expenses/${id}`);
      fetchHistory(page);
    } catch { /* silently fail */ }
  };

  return (
    <>
      <motion.div
        className="history-page"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="history-page__header">
          <h1 className="history-page__title">Transaction History</h1>
        </div>

        {loading ? (
          <div className="history-page__skeletons">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 62, borderRadius: 14 }} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState title="No transactions yet" message="When you log expenses, they will appear here." />
        ) : (
          <div className="history-page__content">
            <motion.div
              className="history-page__list"
              variants={listContainer}
              initial="hidden"
              animate="show"
            >
              {expenses.map(e => (
                <motion.div key={e._id} variants={listItem}>
                  <ExpenseRow
                    expense={e}
                    onDelete={handleDelete}
                    onEdit={exp => {
                      setEditExp(exp);
                      setSheetOpen(true);
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="history-page__pagination">
                <motion.button
                  className="history-page__pag-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  whileTap={tapScale}
                >
                  ◀ Prev
                </motion.button>
                <span className="history-page__pag-info mono">
                  {page} / {totalPages}
                </span>
                <motion.button
                  className="history-page__pag-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  whileTap={tapScale}
                >
                  Next ▶
                </motion.button>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 80 }} />
      </motion.div>

      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditExp(null); }}
        onSaved={() => fetchHistory(page)}
        editExpense={editExp}
      />
    </>
  );
}
