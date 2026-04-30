import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Loader from './components/ui/Loader';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

// ─── Lazy-loaded Pages ──────────────────────────────────────────
const Home             = lazy(() => import('./pages/Home'));
const Login            = lazy(() => import('./pages/Auth/Login'));
const Register         = lazy(() => import('./pages/Auth/Register'));
const EventList        = lazy(() => import('./pages/Events/EventList'));
const EventDetail      = lazy(() => import('./pages/Events/EventDetail'));
const CreateEvent      = lazy(() => import('./pages/Events/CreateEvent'));
const EditEvent        = lazy(() => import('./pages/Events/EditEvent'));
const Booking          = lazy(() => import('./pages/Events/Booking'));
const MyBookings       = lazy(() => import('./pages/Bookings/MyBookings'));
const BookingDetail    = lazy(() => import('./pages/Bookings/BookingDetail'));
const Profile          = lazy(() => import('./pages/Account/Profile'));
const OrganizerPublic  = lazy(() => import('./pages/Public/OrganizerProfile'));
const UserDashboard    = lazy(() => import('./pages/Dashboard/UserDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/Dashboard/OrganizerDashboard'));
const AdminDashboard   = lazy(() => import('./pages/Dashboard/AdminDashboard'));
const NotFound         = lazy(() => import('./pages/NotFound'));
const Unauthorized     = lazy(() => import('./pages/Unauthorized'));

// ─── Scroll to top on every route change ────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const PageLoader = () => <Loader fullScreen variant="premium" />;

// ─── Root redirect ───────────────────────────────────────────────
// Guests → /events  |  Users → /events  |  Organizers → their dashboard  |  Admin → admin dashboard
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  // Guest users land on the public events page
  if (!user) return <Navigate to="/events" replace />;

  const role = user.role;
  if (role === ROLES.ADMIN)     return <Navigate to="/dashboard/admin"     replace />;
  if (role === ROLES.ORGANIZER) return <Navigate to="/dashboard/organizer" replace />;
  return <Navigate to="/events" replace />;
};

// ─── Auth page guard ─────────────────────────────────────────────
// Logged-in users should not revisit /login or /register
const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-paper font-sans text-ink-900 selection:bg-forest-100 selection:text-forest-900">
      <ScrollToTop />
      <Navbar />

      <main className="flex-grow relative">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>

              {/* ── Root ──────────────────────────────────────── */}
              <Route path="/" element={<RootRedirect />} />

              {/* ── Public pages (no login required) ─────────── */}
              <Route path="/home"           element={<Home />} />
              <Route path="/events"         element={<EventList />} />
              <Route path="/events/:id"     element={<EventDetail />} />
              <Route path="/organizers/:id" element={<OrganizerPublic />} />

              {/* ── Auth pages (redirect to / if already logged in) */}
              <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

              {/* ── Organizer / Admin only ────────────────────── */}
              <Route path="/events/create" element={
                <ProtectedRoute requiredRole={[ROLES.ORGANIZER, ROLES.ADMIN]}>
                  <CreateEvent />
                </ProtectedRoute>
              } />
              <Route path="/events/:id/edit" element={
                <ProtectedRoute requiredRole={[ROLES.ORGANIZER, ROLES.ADMIN]}>
                  <EditEvent />
                </ProtectedRoute>
              } />

              {/* ── Authenticated user routes (login to book) ── */}
              <Route path="/booking/:id" element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/bookings/:id" element={
                <ProtectedRoute>
                  <BookingDetail />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* ── Role dashboards ───────────────────────────── */}
              <Route path="/dashboard/user" element={
                <ProtectedRoute requiredRole={[ROLES.USER, ROLES.ORGANIZER, ROLES.ADMIN]}>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/organizer" element={
                <ProtectedRoute requiredRole={[ROLES.ORGANIZER, ROLES.ADMIN]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute requiredRole={[ROLES.ADMIN]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* ── Fallbacks ─────────────────────────────────── */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*"             element={<NotFound />} />

            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

export default App;