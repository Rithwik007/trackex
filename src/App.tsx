import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { isAuthenticated } from './lib/auth';
import BottomNav from './components/BottomNav';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function MainContent() {
  const location = useLocation();
  const authed = isAuthenticated();

  return (
    <div className="page-shell">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {!authed ? (
            <>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </>
          ) : (
            <>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/history"     element={<History />} />
              <Route path="/insights"    element={<Insights />} />
              <Route path="/profile"     element={<Profile />} />
              <Route path="/admin"       element={<Admin />} />
              <Route path="/settings"    element={<Navigate to="/profile" replace />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </AnimatePresence>
      {authed && location.pathname !== '/onboarding' && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}
