import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAuth } from '../lib/auth';
import { apiGet, apiDelete } from '../lib/api';
import { pageTransition, listContainer, listItem, tapScale } from '../lib/animations';
import BalanceCard from '../components/BalanceCard';
import ExpenseRow from '../components/ExpenseRow';
import type { Expense } from '../components/ExpenseRow';
import AddExpenseSheet from '../components/AddExpenseSheet';
import SpendByCategoryChart from '../components/SpendByCategoryChart';
import EmptyState from '../components/EmptyState';
import './Dashboard.css';

interface ExpensesResponse {
  expenses: Expense[];
  balance: number;
  total_spent: number;
  total_income: number;
  starting_balance: number;
}

export default function Dashboard() {
  const auth = getAuth()!;
  const [data, setData]         = useState<ExpensesResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editExp, setEditExp]   = useState<Expense | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<ExpensesResponse>('/api/expenses?limit=50');
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Could not connect to database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    await apiDelete(`/api/expenses/${id}`);
    fetchData();
  };

  const recent = data?.expenses.slice(0, 10) ?? [];

  return (
    <>
      <motion.div
        className="dashboard"
        variants={pageTransition}
        initial="initial" animate="animate" exit="exit"
      >
        {/* Header */}
        <div className="dashboard__header">
          <span className="dashboard__wordmark">TrackEx</span>
          <span className="dashboard__username">@{auth.username}</span>
        </div>

        {/* Balance */}
        <BalanceCard
          balance={data?.balance ?? 0}
          totalSpent={data?.total_spent ?? 0}
          totalIncome={data?.total_income ?? 0}
          name={auth.name}
          loading={loading}
        />

        {error && (
          <div className="card" style={{ padding: 16, borderColor: 'var(--danger)', background: 'var(--danger-glow)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontWeight: 600, color: 'var(--danger)' }}>⚠️ Database Connection Issue</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {error}
            </span>
            <button onClick={fetchData} style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              Try Again
            </button>
          </div>
        )}

        {/* Chart */}
        {!loading && (data?.expenses?.length ?? 0) > 0 && (
          <motion.div className="dashboard__section card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <SpendByCategoryChart expenses={data!.expenses} />
          </motion.div>
        )}

        {/* Recent */}
        <div className="dashboard__section-header">
          <span className="dashboard__section-title">Recent Transactions</span>
          {recent.length > 0 && (
            <a href="/history" className="dashboard__see-all">See all →</a>
          )}
        </div>

        {loading ? (
          <div className="dashboard__skeletons">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 62, borderRadius: 14 }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState onCta={() => setSheetOpen(true)} />
        ) : (
          <motion.div
            className="dashboard__list"
            variants={listContainer}
            initial="hidden" animate="show"
          >
            {recent.map(e => (
              <motion.div key={e._id} variants={listItem}>
                <ExpenseRow
                  expense={e}
                  onDelete={handleDelete}
                  onEdit={exp => { setEditExp(exp); setSheetOpen(true); }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Spacer for FAB */}
        <div style={{ height: 88 }} />
      </motion.div>

      {/* FAB */}
      <motion.button
        id="add-expense-fab"
        className="dashboard__fab"
        onClick={() => { setEditExp(null); setSheetOpen(true); }}
        whileTap={tapScale}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 18, stiffness: 260 }}
        aria-label="Add transaction"
      >
        <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
      </motion.button>

      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditExp(null); }}
        onSaved={fetchData}
        editExpense={editExp}
      />
    </>
  );
}
