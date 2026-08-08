import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './BottomNav.css';

const TABS = [
  { path: '/',         label: 'Home',     icon: HomeIcon },
  { path: '/history',  label: 'History',  icon: HistoryIcon },
  { path: '/insights', label: 'Insights', icon: InsightsIcon },
  { path: '/profile',  label: 'Profile',  icon: ProfileIcon },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="bottom-nav__inner">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              id={`nav-${label.toLowerCase()}`}
              className="bottom-nav__tab"
              aria-label={label}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="bottom-nav__pill"
                  transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                />
              )}
              <motion.div
                className={`bottom-nav__icon ${active ? 'active' : ''}`}
                whileTap={{ scale: 0.88 }}
              >
                <Icon />
              </motion.div>
              <span className={`bottom-nav__label ${active ? 'active' : ''}`}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function InsightsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
