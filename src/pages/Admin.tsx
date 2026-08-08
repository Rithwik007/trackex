import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth } from '../lib/auth';
import { apiGet, apiDelete } from '../lib/api';
import { tapScale, pageTransition } from '../lib/animations';
import './Admin.css';

export interface AdminUserItem {
  user_id: string;
  username: string;
  name: string;
  starting_balance: number;
  current_balance: number;
  total_income: number;
  total_spent: number;
  total_transactions: number;
  groq_requests_today: number;
  groq_requests_all_time: number;
  last_active: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{ users: AdminUserItem[] }>('/api/admin/users');
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || 'Access denied');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth || auth.username.toLowerCase() !== 'rithwikex') {
      setError('Forbidden: Admin access required');
      setTimeout(() => navigate('/'), 1500);
      return;
    }
    fetchAdminData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (confirmInput.trim().toLowerCase() !== deleteTarget.username.toLowerCase()) {
      return;
    }
    setDeleting(true);
    try {
      await apiDelete(`/api/admin/users/${deleteTarget.user_id}`);
      setDeleteTarget(null);
      setConfirmInput('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const totalQueriesToday = users.reduce((acc, u) => acc + u.groq_requests_today, 0);
  const totalQueriesAllTime = users.reduce((acc, u) => acc + u.groq_requests_all_time, 0);

  return (
    <motion.div
      className="admin-page page-shell__content"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="admin-header">
        <div>
          <h1 className="admin-title">🛡️ System Administration</h1>
          <p className="admin-sub">User activity, Groq usage & data management</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchAdminData} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {error ? (
        <div className="admin-error-card">{error}</div>
      ) : null}

      {/* Summary KPI Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card card">
          <span className="admin-stat-label">Total Users</span>
          <span className="admin-stat-val mono">{users.length}</span>
        </div>
        <div className="admin-stat-card card">
          <span className="admin-stat-label">Groq Today</span>
          <span className="admin-stat-val mono">{totalQueriesToday}</span>
        </div>
        <div className="admin-stat-card card">
          <span className="admin-stat-label">Groq All-Time</span>
          <span className="admin-stat-val mono">{totalQueriesAllTime}</span>
        </div>
      </div>

      {/* User Table */}
      <div className="admin-table-card card">
        <h2 className="admin-table-title">Registered Accounts ({users.length})</h2>
        {loading ? (
          <div className="admin-loading">Loading system metrics...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current Balance</th>
                  <th>Transactions</th>
                  <th>Groq Today</th>
                  <th>Groq Total</th>
                  <th>Last Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} className={u.username.toLowerCase() === 'rithwikex' ? 'is-admin' : ''}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-username">@{u.username}</span>
                        <span className="admin-name">{u.name}</span>
                      </div>
                    </td>
                    <td className="mono">₹{u.current_balance.toFixed(2)}</td>
                    <td className="mono">{u.total_transactions}</td>
                    <td className="mono">{u.groq_requests_today}</td>
                    <td className="mono">{u.groq_requests_all_time}</td>
                    <td className="admin-time-cell">
                      {new Date(u.last_active).toLocaleDateString()} {new Date(u.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {u.username.toLowerCase() !== 'rithwikex' ? (
                        <motion.button
                          className="admin-delete-btn"
                          whileTap={tapScale}
                          onClick={() => { setDeleteTarget(u); setConfirmInput(''); }}
                        >
                          🗑️ Delete
                        </motion.button>
                      ) : (
                        <span className="admin-badge">Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget ? (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal card" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">⚠️ Confirm User Deletion</h3>
            <p className="admin-modal-desc">
              You are about to permanently delete <strong>@{deleteTarget.username}</strong> ({deleteTarget.name}) and all <strong>{deleteTarget.total_transactions}</strong> associated transactions. This action cannot be undone.
            </p>

            <div className="admin-modal-field">
              <label htmlFor="confirm-user-input">Type <code>{deleteTarget.username}</code> to confirm:</label>
              <input
                id="confirm-user-input"
                className="admin-modal-input"
                placeholder={deleteTarget.username}
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="admin-modal-actions">
              <button className="admin-modal-cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="admin-modal-confirm"
                disabled={confirmInput.trim().toLowerCase() !== deleteTarget.username.toLowerCase() || deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete User'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
