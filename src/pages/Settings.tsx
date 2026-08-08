import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAuth, clearAuth } from '../lib/auth';
import { apiGet, apiPatch } from '../lib/api';
import { pageTransition, tapScale } from '../lib/animations';
import './Settings.css';

interface UserBalanceResponse {
  starting_balance: number;
}

export default function Settings() {
  const auth = getAuth()!;
  const [name]                  = useState(auth.name);
  const [balance, setBalance]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function loadBalance() {
      try {
        const res = await apiGet<UserBalanceResponse>(`/api/expenses?limit=1`);
        setBalance(res.starting_balance.toString());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    loadBalance();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(balance);
    if (!balance || isNaN(amt) || amt < 0) {
      setError('Starting balance must be a number >= 0');
      return;
    }
    setSaving(true); setError(''); setSuccess(false);

    try {
      await apiPatch(`/api/users/${auth.user_id}/balance`, { starting_balance: amt });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    // Use window.location to force a hard reload and router reset
    window.location.href = '/onboarding';
  };

  return (
    <motion.div
      className="settings-page"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
      </div>

      <div className="settings-page__content">
        {/* User Card */}
        <div className="settings-page__user-card card">
          <div className="settings-page__avatar">
            {auth.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="settings-page__user-info">
            <h2 className="settings-page__user-name">{auth.name}</h2>
            <span className="settings-page__user-handle">@{auth.username}</span>
          </div>
        </div>

        {/* Edit Form */}
        <form className="settings-page__form card" onSubmit={handleSave}>
          <h3 className="settings-page__section-title">Edit Profile</h3>

          <div className="settings-page__field">
            <label className="settings-page__label">Username</label>
            <input
              className="settings-page__input settings-page__input--disabled"
              value={auth.username}
              disabled
            />
            <span className="settings-page__help-text">Username cannot be changed.</span>
          </div>

          <div className="settings-page__field">
            <label className="settings-page__label" htmlFor="settings-name">Display Name</label>
            <input
              id="settings-name"
              className="settings-page__input settings-page__input--disabled"
              value={name}
              disabled
            />
            <span className="settings-page__help-text">To update display name, please contact support.</span>
          </div>

          <div className="settings-page__field">
            <label className="settings-page__label" htmlFor="settings-balance">Starting Balance (₹)</label>
            {loading ? (
              <div className="skeleton" style={{ height: 48, borderRadius: 14 }} />
            ) : (
              <input
                id="settings-balance"
                className="settings-page__input mono"
                type="number"
                inputMode="decimal"
                value={balance}
                onChange={e => { setBalance(e.target.value); setSuccess(false); }}
              />
            )}
          </div>

          {error && <p className="settings-page__error">{error}</p>}
          {success && <p className="settings-page__success">Settings saved successfully!</p>}

          <motion.button
            id="save-settings-btn"
            className={`settings-page__save-btn ${saving ? 'saving' : ''}`}
            type="submit"
            disabled={saving || loading}
            whileTap={tapScale}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </motion.button>
        </form>

        {/* Danger Zone */}
        <div className="settings-page__danger card">
          <h3 className="settings-page__section-title settings-page__section-title--danger">Danger Zone</h3>
          <p className="settings-page__danger-text">Logging out will remove your active session from this device.</p>
          <motion.button
            id="logout-btn"
            className="settings-page__logout-btn"
            onClick={handleLogout}
            whileTap={tapScale}
          >
            Log Out
          </motion.button>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </motion.div>
  );
}
