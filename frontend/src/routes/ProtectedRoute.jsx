import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Shared spinner used by both guards ─── */
const Spinner = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center gap-4"
    style={{ backgroundColor: 'var(--paper-bg)' }}
  >
    <div
      className="w-12 h-12 rounded-full border-4 animate-spin"
      style={{ borderColor: 'var(--forest-700)', borderTopColor: 'transparent' }}
    />
    <p style={{
      color: 'var(--ink-400)', fontSize: '10px', fontWeight: 900,
      letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'sans-serif'
    }}>
      Loading…
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════
   RequireAuth  — Global gate: must be logged in at all
   Redirects unauthenticated visitors to /login,
   preserving the page they tried to reach.
═══════════════════════════════════════════════════ */
export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};

/* ═══════════════════════════════════════════════════
   ProtectedRoute  — Role-based on top of auth
   Use this when a page also requires a specific role.
═══════════════════════════════════════════════════ */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;