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
import type { AggregateData } from './Profile';
import './Dashboard.css';

export default function Dashboard() {
  const auth = getAuth()!;
  const [data, setData] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiGet<AggregateData>('/api/aggregate');
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? 'Could not connect to database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    await apiDelete(`/api/expenses/${id}`);
    fetchData();
  };

  const recent = (data?.transactions as Expense[])?.slice(0, 10) ?? [];

  return (
    <>
      <motion.div
        className="dashboard page-shell__content"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Header */}
        <div className="dashboard__header">
          <span className="dashboard__wordmark">TrackEx</span>
          <span className="dashboard__username">@{auth.username}</span>
        </div>

        {/* Balance Card scoped to current month activity */}
        <BalanceCard
          balance={data?.current_balance ?? 0}
          totalSpent={data?.spent ?? 0}
          totalIncome={data?.income ?? 0}
          name={auth.name}
          loading={loading}
        />

        {error && (
          <div
            className="card"
            style={{
              padding: 16,
              borderColor: 'var(--danger)',
              background: 'var(--danger-glow)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
              ⚠️ Database Connection Issue
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{error}</span>
            <button
              onClick={fetchData}
              style={{
                alignSelf: 'flex-start',
                fontSize: 12,
                color: 'var(--accent)',
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Category Breakdown Chart */}
        {!loading && (data?.transactions?.length ?? 0) > 0 && (
          <motion.div
            className="dashboard__section card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <SpendByCategoryChart expenses={data!.transactions as Expense[]} />
          </motion.div>
        )}

        {/* Recent Transactions for Current Month */}
        <div className="dashboard__section-header">
          <span className="dashboard__section-title">
            This Month's Activity ({data?.label ?? ''})
          </span>
          <a href="/history" className="dashboard__see-all">
            See all →
          </a>
        </div>

        {loading ? (
          <div className="dashboard__skeletons">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 62, borderRadius: 14 }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            title="No expenses this month yet"
            message="Tap the + button below to log your first transaction for this month."
          />
        ) : (
          <motion.div
            className="dashboard__list"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {recent.map(e => (
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
        )}
      </motion.div>

      {/* Floating Add Expense FAB */}
      <motion.button
        id="add-expense-fab"
        className="fab"
        onClick={() => {
          setEditExp(null);
          setSheetOpen(true);
        }}
        whileTap={{ scale: 0.9 }}
        aria-label="Add transaction"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      {/* Add / Edit Expense Sheet */}
      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditExp(null);
        }}
        onSaved={fetchData}
        editExpense={editExp}
      />
    </>
  );
}
