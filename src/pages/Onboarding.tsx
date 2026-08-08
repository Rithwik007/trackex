import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuth } from '../lib/auth';
import { tapScale } from '../lib/animations';
import './Onboarding.css';

type Step = 'identity' | 'balance';

export default function Onboarding() {
  const navigate  = useNavigate();
  const [step, setStep]         = useState<Step>('identity');
  const [username, setUsername] = useState('');
  const [name, setName]         = useState('');
  const [balance, setBalance]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleIdentity = () => {
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,20}$/.test(u)) {
      setError('2–20 chars, letters/numbers/underscore only');
      return;
    }
    if (name.trim().length < 1) { setError('Name required'); return; }
    setError('');
    setStep('balance');
  };

  const handleFinish = async () => {
    const amt = parseFloat(balance);
    if (balance && (isNaN(amt) || amt < 0)) {
      setError('Enter a valid starting balance');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          name: name.trim(),
          starting_balance: balance ? amt : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setAuth({
        user_id: data.user_id,
        token:   data.token,
        username: data.username,
        name:    data.name,
      });
      navigate('/', { replace: true });
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
              <h1 className="onboarding__step-title">Who are you?</h1>
              <p className="onboarding__step-sub">Pick a username to identify yourself. No password needed.</p>

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

              {error && <p className="onboarding__error">{error}</p>}

              <motion.button
                id="ob-next-btn"
                className="onboarding__btn"
                onClick={handleIdentity}
                whileTap={tapScale}
              >
                Continue →
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
              <h2 className="onboarding__step-title">Starting Balance</h2>
              <p className="onboarding__step-sub">How much money are you starting with? You can edit this later.</p>

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
                  autoFocus
                />
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
                {loading ? 'Setting up…' : "Let's Go 🚀"}
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
