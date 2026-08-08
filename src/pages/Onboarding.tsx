import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuth } from '../lib/auth';
import { apiPost } from '../lib/api';
import { tapScale } from '../lib/animations';
import './Onboarding.css';

type Step = 'identity' | 'balance';

interface UserResponse {
  user_id?: string;
  token?: string;
  username?: string;
  name?: string;
  starting_balance?: number;
  is_new?: boolean;
  exists?: boolean;
  error?: string;
}

export default function Onboarding() {
  const navigate  = useNavigate();
  const [step, setStep]         = useState<Step>('identity');
  const [username, setUsername] = useState('');
  const [name, setName]         = useState('');
  const [balance, setBalance]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    const lastUser = localStorage.getItem('trackex_last_username');
    if (lastUser) {
      setUsername(lastUser);
    }
  }, []);

  const handleIdentity = async () => {
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,20}$/.test(u)) {
      setError('2–20 chars, letters/numbers/underscore only');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Check if user exists in database
      const res = await apiPost<UserResponse>('/api/users', { username: u });

      if (res.user_id && res.token) {
        // Existing user → Log in directly
        setAuth({
          user_id: res.user_id,
          token: res.token,
          username: res.username!,
          name: res.name!,
        });
        localStorage.setItem('trackex_last_username', res.username!);
        navigate('/', { replace: true });
        return;
      }

      // New user → Proceed to step 2 (Name & Starting Balance)
      setIsExisting(false);
      if (!name) {
        // Default display name to capitalized username
        setName(u.charAt(0).toUpperCase() + u.slice(1));
      }
      setStep('balance');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    const amt = parseFloat(balance);
    if (balance && (isNaN(amt) || amt < 0)) {
      setError('Enter a valid starting balance');
      return;
    }
    if (!name.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiPost<UserResponse>('/api/users', {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        starting_balance: balance ? amt : 0,
      });

      if (res.user_id && res.token) {
        setAuth({
          user_id: res.user_id,
          token:   res.token,
          username: res.username!,
          name:    res.name!,
        });
        localStorage.setItem('trackex_last_username', res.username!);
        navigate('/', { replace: true });
      } else {
        throw new Error('Registration failed');
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      {/* Background orbs */}
      <div className="onboarding__orb onboarding__orb--1" />
      <div className="onboarding__orb onboarding__orb--2" />

      <div className="onboarding__card card">
        {/* Logo */}
        <div className="onboarding__logo">
          <span className="onboarding__logo-icon">💸</span>
          <span className="onboarding__logo-text">TrackEx</span>
        </div>
        <p className="onboarding__tagline">Log it, see it, own it.</p>

        {/* Progress dots */}
        <div className="onboarding__dots" aria-label="Step indicator">
          <span className={`onboarding__dot ${step === 'identity' ? 'active' : 'done'}`} />
          <span className={`onboarding__dot ${step === 'balance'  ? 'active' : ''}`} />
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 'identity' ? (
            <motion.div
              key="identity"
              className="onboarding__step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h1 className="onboarding__step-title">Welcome</h1>
              <p className="onboarding__step-sub">Enter your username to log in or create a new account.</p>

              <div className="onboarding__field">
                <label className="onboarding__label" htmlFor="ob-username">Username</label>
                <input
                  id="ob-username"
                  className="onboarding__input"
                  placeholder="e.g. rithwik_07"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {error && <p className="onboarding__error">{error}</p>}

              <motion.button
                id="ob-next-btn"
                className={`onboarding__btn ${loading ? 'loading' : ''}`}
                onClick={handleIdentity}
                whileTap={tapScale}
                disabled={loading}
              >
                {loading ? <span className="sheet-spinner" /> : null}
                {loading ? 'Checking...' : 'Continue →'}
              </motion.button>
            </motion.div>

          ) : (
            <motion.div
              key="balance"
              className="onboarding__step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h2 className="onboarding__step-title">New Account Setup</h2>
              <p className="onboarding__step-sub">Set your display name and initial starting balance for <strong>@{username}</strong>.</p>

              <div className="onboarding__field">
                <label className="onboarding__label" htmlFor="ob-name">Display Name</label>
                <input
                  id="ob-name"
                  className="onboarding__input"
                  placeholder="e.g. Rithwik"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                />
              </div>

              <div className="onboarding__field" style={{ marginTop: 12 }}>
                <label className="onboarding__label" htmlFor="ob-balance">Starting Balance</label>
                <div className="onboarding__amount-wrap">
                  <span className="onboarding__currency mono">₹</span>
                  <input
                    id="ob-balance"
                    className="onboarding__amount-input mono"
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    min="0"
                    value={balance}
                    onChange={e => { setBalance(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              {error && <p className="onboarding__error">{error}</p>}

              <motion.button
                id="ob-finish-btn"
                className={`onboarding__btn ${loading ? 'loading' : ''}`}
                onClick={handleFinish}
                whileTap={tapScale}
                disabled={loading}
              >
                {loading ? <span className="sheet-spinner" /> : null}
                {loading ? 'Creating account…' : 'Create Account 🚀'}
              </motion.button>

              <button
                className="onboarding__back"
                onClick={() => { setStep('identity'); setError(''); }}
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
