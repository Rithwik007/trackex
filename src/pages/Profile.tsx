import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAuth, clearAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import { pageTransition, tapScale, listContainer, listItem } from '../lib/animations';
import { CATEGORIES } from '../lib/categories';
import './Profile.css';

interface MonthlyAnalytics {
  year: number;
  month: number;
  label: string;
  start_balance: number;
  income: number;
  expense: number;
  net: number;
  end_balance: number;
}

interface StatsData {
  balance: number;
  total_spent: number;
  total_income: number;
  starting_balance: number;
  monthly_analytics: MonthlyAnalytics[];
  expenses: { category: string; amount: number; note: string; date: string; type?: 'expense' | 'income' }[];
}

export default function Profile() {
  const auth = getAuth()!;
  const [stats, setStats]   = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<StatsData>('/api/expenses?limit=200')
      .then(res => setStats(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/onboarding';
  };

  // Per-category spending breakdown (expenses only)
  const categoryTotals = CATEGORIES
    .map(c => ({
      cat: c,
      total: stats?.expenses
        .filter(e => e.category === c.id && (e.type === 'expense' || !e.type))
        .reduce((s, e) => s + e.amount, 0) ?? 0,
      count: stats?.expenses
        .filter(e => e.category === c.id && (e.type === 'expense' || !e.type))
        .length ?? 0,
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalTx = stats?.expenses.length ?? 0;

  return (
    <motion.div
      className="profile"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* ── Hero Card ── */}
      <div className="profile__hero card">
        <div className="profile__hero-bg" />
        <div className="profile__avatar-wrap">
          <div className="profile__avatar">
            <span className="profile__avatar-initials">
              {auth.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="profile__identity">
            <h1 className="profile__name">{auth.name}</h1>
            <span className="profile__handle">@{auth.username}</span>
          </div>
        </div>
      </div>

      {/* ── 3-Stat Row ── */}
      {loading ? (
        <div className="profile__stats-row">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton profile__stat-skeleton" />
          ))}
        </div>
      ) : (
        <motion.div
          className="profile__stats-row"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div className="profile__stat-card card" variants={listItem}>
            <span className="profile__stat-value mono" style={{ color: 'var(--accent)' }}>
              +₹{(stats?.total_income ?? 0).toFixed(0)}
            </span>
            <span className="profile__stat-label">Income</span>
          </motion.div>

          <motion.div className="profile__stat-card card" variants={listItem}>
            <span className="profile__stat-value mono" style={{ color: 'var(--danger)' }}>
              −₹{(stats?.total_spent ?? 0).toFixed(0)}
            </span>
            <span className="profile__stat-label">Spent</span>
          </motion.div>

          <motion.div className="profile__stat-card card" variants={listItem}>
            <span className="profile__stat-value mono">{totalTx}</span>
            <span className="profile__stat-label">Transactions</span>
          </motion.div>
        </motion.div>
      )}

      {/* ── Balance Overview ── */}
      {!loading && (
        <div className="profile__section card">
          <h2 className="profile__section-title">💰 Balance Overview</h2>
          <div className="profile__balance-display">
            <span className="profile__balance-amount mono">
              ₹{(stats?.balance ?? 0).toFixed(2)}
            </span>
            <span className="profile__balance-sub">
              Current remaining balance
            </span>
          </div>
          <div className="profile__monthly-grid" style={{ paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
            <div className="profile__monthly-item">
              <span className="profile__monthly-item-label">Base Balance</span>
              <span className="profile__monthly-item-val mono">
                ₹{(stats?.starting_balance ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="profile__monthly-item">
              <span className="profile__monthly-item-label">+ Income</span>
              <span className="profile__monthly-item-val mono" style={{ color: 'var(--accent)' }}>
                +₹{(stats?.total_income ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="profile__monthly-item">
              <span className="profile__monthly-item-label">− Spent</span>
              <span className="profile__monthly-item-val mono" style={{ color: 'var(--danger)' }}>
                −₹{(stats?.total_spent ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly Balance Analytics ── */}
      {(stats?.monthly_analytics?.length ?? 0) > 0 && (
        <div className="profile__section card">
          <h2 className="profile__section-title">📅 Monthly Analytics</h2>
          <div className="profile__monthly-list">
            {stats!.monthly_analytics.map(m => (
              <div key={`${m.year}-${m.month}`} className="profile__monthly-card">
                <div className="profile__monthly-header">
                  <span className="profile__monthly-label">{m.label}</span>
                  <span
                    className={`profile__monthly-end mono ${m.end_balance < 0 ? 'profile__negative' : 'profile__positive'}`}
                  >
                    End: ₹{m.end_balance.toFixed(2)}
                  </span>
                </div>
                <div className="profile__monthly-grid">
                  <div className="profile__monthly-item">
                    <span className="profile__monthly-item-label">Start Bal</span>
                    <span className="profile__monthly-item-val mono">
                      ₹{m.start_balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="profile__monthly-item">
                    <span className="profile__monthly-item-label">Income</span>
                    <span className="profile__monthly-item-val mono" style={{ color: 'var(--accent)' }}>
                      +₹{m.income.toFixed(2)}
                    </span>
                  </div>
                  <div className="profile__monthly-item">
                    <span className="profile__monthly-item-label">Spent</span>
                    <span className="profile__monthly-item-val mono" style={{ color: 'var(--danger)' }}>
                      −₹{m.expense.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Breakdown ── */}
      {categoryTotals.length > 0 && (
        <div className="profile__section card">
          <h2 className="profile__section-title">📊 Category Breakdown</h2>
          <div className="profile__category-list">
            {categoryTotals.map(({ cat, total, count }) => {
              const maxTotal = categoryTotals[0]?.total || 1;
              const pct = (total / maxTotal) * 100;
              return (
                <div key={cat.id} className="profile__category-row">
                  <span className="profile__category-icon">{cat.icon}</span>
                  <div className="profile__category-info">
                    <div className="profile__category-top">
                      <span className="profile__category-name">{cat.label}</span>
                      <span className="profile__category-amount mono" style={{ color: cat.color }}>
                        ₹{total.toFixed(0)}
                      </span>
                    </div>
                    <div className="profile__category-bar-wrap">
                      <div
                        className="profile__category-bar"
                        style={{ width: `${pct}%`, background: cat.color }}
                      />
                    </div>
                    <span className="profile__category-count">
                      {count} transaction{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      <div className="profile__section card profile__section--danger">
        <h2 className="profile__section-title profile__section-title--danger">⚠️ Danger Zone</h2>
        <p className="profile__danger-text">
          Logging out removes your session from this device. Your data stays safe in the cloud.
        </p>
        <motion.button
          id="logout-btn"
          className="profile__logout-btn"
          onClick={handleLogout}
          whileTap={tapScale}
        >
          Log Out
        </motion.button>
      </div>
    </motion.div>
  );
}
