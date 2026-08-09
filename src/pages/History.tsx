import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiGet, apiDelete } from '../lib/api';
import { pageTransition, listContainer, listItem, tapScale } from '../lib/animations';
import ExpenseRow from '../components/ExpenseRow';
import type { Expense } from '../components/ExpenseRow';
import AddExpenseSheet from '../components/AddExpenseSheet';
import EmptyState from '../components/EmptyState';
import MonthSelector from '../components/MonthSelector';
import type { AggregateData } from './Profile';
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
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [showAllMode, setShowAllMode] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (showAllMode) {
        const res = await apiGet<HistoryResponse>(`/api/expenses?page=${page}&limit=15`);
        setExpenses(res.expenses);
        setTotalPages(res.pagination.pages);
      } else {
        const res = await apiGet<AggregateData>(`/api/aggregate?year=${selectedYear}&month=${selectedMonth}`);
        setExpenses(res.transactions as Expense[]);
        setTotalPages(1);
      }
    } catch {
      /* silently handle */
    } finally {
      setLoading(false);
    }
  }, [showAllMode, selectedYear, selectedMonth, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/expenses/${id}`);
      loadData();
    } catch {
      /* handle error */
    }
  };

  return (
    <>
      <motion.div
        className="history-page page-shell__content"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="history-page__header">
          <h1 className="history-page__title">Transaction History</h1>

          {/* Mode Toggle */}
          <div className="history-page__toggle-wrap">
            <button
              className={`history-page__toggle-btn ${!showAllMode ? 'active' : ''}`}
              onClick={() => { setShowAllMode(false); setPage(1); }}
            >
              📅 Month View
            </button>
            <button
              className={`history-page__toggle-btn ${showAllMode ? 'active' : ''}`}
              onClick={() => { setShowAllMode(true); setPage(1); }}
            >
              🌐 Show All
            </button>
          </div>
        </div>

        {/* Reusable Month Selector (only in Month View) */}
        {!showAllMode && (
          <MonthSelector
            year={selectedYear}
            month={selectedMonth}
            onChange={(y, m) => {
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
          />
        )}

        {loading ? (
          <div className="history-page__skeletons">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 62, borderRadius: 14 }} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title={showAllMode ? 'No transactions yet' : 'No transactions this month'}
            message={
              showAllMode
                ? 'When you log expenses, they will appear here.'
                : 'Select another month or add a new transaction.'
            }
          />
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

            {/* Pagination Controls (Show All mode) */}
            {showAllMode && totalPages > 1 && (
              <div className="history-page__pagination">
                <motion.button
                  className="history-page__pag-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  whileTap={tapScale}
                >
                  Previous
                </motion.button>
                <span className="history-page__pag-info">
                  Page {page} of {totalPages}
                </span>
                <motion.button
                  className="history-page__pag-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  whileTap={tapScale}
                >
                  Next
                </motion.button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Edit sheet */}
      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditExp(null);
        }}
        onSaved={loadData}
        editExpense={editExp}
      />
    </>
  );
}
