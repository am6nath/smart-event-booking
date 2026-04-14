import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion'; // For fluid transitions

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Loader from './components/ui/Loader';
import ProtectedRoute, { RequireAuth } from './routes/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

// Page Imports
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const EventList = lazy(() => import('./pages/Events/EventList'));
const EventDetail = lazy(() => import('./pages/Events/EventDetail'));
const CreateEvent = lazy(() => import('./pages/Events/CreateEvent'));
const EditEvent = lazy(() => import('./pages/Events/EditEvent'));
const Booking = lazy(() => import('./pages/Events/Booking'));
const MyBookings = lazy(() => import('./pages/Bookings/MyBookings'));
const BookingDetail = lazy(() => import('./pages/Bookings/BookingDetail'));
const Profile = lazy(() => import('./pages/Account/Profile'));
const OrganizerPublic = lazy(() => import('./pages/Public/OrganizerProfile'));
const UserDashboard = lazy(() => import('./pages/Dashboard/UserDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/Dashboard/OrganizerDashboard'));
const AdminDashboard = lazy(() => import('./pages/Dashboard/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// ✨ Premium Feature: Smooth Scroll to Top on Navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const PageLoader = () => <Loader fullScreen variant="premium" />;

// ✨ Smart Redirect: Replaces the Home page at the root to ensure 
// the user lands in their primary workspace immediately.
const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role;
  if (role === ROLES.ADMIN) return <Navigate to="/dashboard/admin" replace />;
  if (role === ROLES.ORGANIZER) return <Navigate to="/dashboard/organizer" replace />;
  return <Navigate to="/events" replace />;
};

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-paper font-sans text-ink-900 selection:bg-forest-100 selection:text-forest-900">
      <ScrollToTop />
      <Navbar />
      
      <main className="flex-grow relative">
        <Suspense fallback={<PageLoader />}>
          {/* ✨ AnimatePresence enables exit animations */}
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Global Entry Point - Handled by RootRedirect */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Authenticated Global Discovery (accessible via direct URL or Nav) */}
              <Route path="/home" element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              } />

              {/* Public Routes Only for No-Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/events" element={
                <RequireAuth>
                  <EventList />
                </RequireAuth>
              } />
              
              <Route path="/events/:id" element={
                <RequireAuth>
                  <EventDetail />
                </RequireAuth>
              } />
              
              <Route path="/organizers/:id" element={
                <RequireAuth>
                  <OrganizerPublic />
                </RequireAuth>
              } />

              {/* Organizer/Admin Routes */}
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
              
              {/* Authenticated User Routes */}
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

              {/* Dashboards */}
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

              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;