import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAuth, clearAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import { pageTransition, tapScale, listContainer, listItem } from '../lib/animations';
import MonthSelector from '../components/MonthSelector';
import './Profile.css';

export interface CategoryBreakdownItem {
  category: string;
  label: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AggregateData {
  year: number;
  month: number;
  label: string;
  start_balance: number;
  income: number;
  spent: number;
  end_balance: number;
  current_balance: number;
  category_breakdown: CategoryBreakdownItem[];
  transaction_count: number;
}

export default function Profile() {
  const auth = getAuth()!;
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [stats, setStats] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonthStats = (year: number, month: number) => {
    setLoading(true);
    apiGet<AggregateData>(`/api/aggregate?year=${year}&month=${month}`)
      .then(res => setStats(res))
      .catch(err => console.error('[Profile Aggregate Error]', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonthStats(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleMonthChange = (y: number, m: number) => {
    setSelectedYear(y);
    setSelectedMonth(m);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/onboarding';
  };

  return (
    <motion.div
      className="profile page-shell__content"
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

      {/* ── Reusable Month Selector ── */}
      <MonthSelector
        year={selectedYear}
        month={selectedMonth}
        onChange={handleMonthChange}
      />

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
            <span className="profile__stat-icon">💰</span>
            <span className="profile__stat-label">Wallet Balance</span>
            <span className="profile__stat-val mono">
              ₹{stats?.current_balance.toFixed(2) ?? '0.00'}
            </span>
          </motion.div>

          <motion.div className="profile__stat-card card" variants={listItem}>
            <span className="profile__stat-icon">💸</span>
            <span className="profile__stat-label">Month Spent</span>
            <span className="profile__stat-val mono spent">
              ₹{stats?.spent.toFixed(2) ?? '0.00'}
            </span>
          </motion.div>

          <motion.div className="profile__stat-card card" variants={listItem}>
            <span className="profile__stat-icon">📈</span>
            <span className="profile__stat-label">Month Income</span>
            <span className="profile__stat-val mono income">
              +₹{stats?.income.toFixed(2) ?? '0.00'}
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* ── Balance Overview for Month ── */}
      {stats && !loading && (
        <div className="profile__section card">
          <h2 className="profile__section-title">⚖️ Balance Overview ({stats.label})</h2>
          <div className="profile__balance-overview">
            <div className="profile__balance-row">
              <span>Start of Month Balance:</span>
              <span className="mono">₹{stats.start_balance.toFixed(2)}</span>
            </div>
            <div className="profile__balance-row">
              <span>Month Income (+):</span>
              <span className="mono income">+₹{stats.income.toFixed(2)}</span>
            </div>
            <div className="profile__balance-row">
              <span>Month Expenses (−):</span>
              <span className="mono spent">−₹{stats.spent.toFixed(2)}</span>
            </div>
            <div className="profile__balance-row total">
              <span>End of Month Balance:</span>
              <span className="mono">₹{stats.end_balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Breakdown for Month ── */}
      {stats && !loading && stats.category_breakdown.length > 0 && (
        <div className="profile__section card">
          <h2 className="profile__section-title">📊 Category Breakdown ({stats.label})</h2>
          <div className="profile__category-list">
            {stats.category_breakdown.map(cat => (
              <div key={cat.category} className="profile__category-row">
                <span className="profile__category-icon">{cat.icon}</span>
                <div className="profile__category-info">
                  <div className="profile__category-top">
                    <span className="profile__category-name">{cat.label}</span>
                    <span className="profile__category-amount mono" style={{ color: cat.color }}>
                      ₹{cat.amount.toFixed(2)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="profile__category-bar-wrap">
                    <div
                      className="profile__category-bar"
                      style={{ width: `${cat.percentage}%`, background: cat.color }}
                    />
                  </div>
                  <span className="profile__category-count">
                    {cat.count} transaction{cat.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && !loading && stats.category_breakdown.length === 0 && (
        <div className="profile__section card empty-state">
          <p className="text-muted">No expenses recorded for {stats.label}.</p>
        </div>
      )}

      {/* ── Low-Emphasis Understated Logout Button (Issue 3) ── */}
      <div className="profile__logout-footer">
        <motion.button
          id="logout-btn"
          className="profile__logout-link"
          onClick={handleLogout}
          whileTap={tapScale}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log out @{auth.username}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
