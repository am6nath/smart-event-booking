import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin')     return '/dashboard/admin';
    if (user?.role === 'organizer') return '/dashboard/organizer';
    return '/events';
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = [
    { to: '/home',   label: 'Home'   },
    { to: '/events', label: 'Events' },
  ];

  return (
    <nav className="sticky top-0 z-[100] bg-paper border-b-2 border-forest-700/30 font-sans"
         style={{ boxShadow: '0 2px 0 rgba(45,90,39,0.08)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── LOGO ── */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-9 h-9 bg-forest-700 flex items-center justify-center
                            text-paper-50 font-serif text-xl italic font-bold
                            border-2 border-forest-800 transition-all duration-200
                            group-hover:bg-forest-800"
                 style={{ boxShadow: '2px 2px 0 rgba(45,90,39,0.3)' }}>
              E
            </div>
            <span className="font-serif font-bold text-lg text-ink-900 tracking-tight
                             group-hover:text-forest-700 transition-colors duration-200">
              EventHub
              <span className="text-forest-600">.</span>
            </span>
          </Link>

          {/* ── DESKTOP NAV LINKS ── */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative text-[11px] font-black uppercase tracking-[0.3em] transition-colors duration-200 pb-0.5 ${
                  isActive(to)
                    ? 'text-forest-700'
                    : 'text-ink-500 hover:text-forest-700'
                }`}
              >
                {label}
                {isActive(to) && (
                  <motion.span
                    layoutId="navUnderline"
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-forest-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* ── USER ACTIONS ── */}
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-500
                             hover:text-forest-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-forest text-[10px] py-2 px-5"
                >
                  Join Now
                </button>
              </div>
            ) : (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 group focus:outline-none"
                >
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-[0.4em] text-ink-300 font-bold">Member</p>
                    <p className="text-sm font-serif italic font-bold text-ink-900 leading-tight">{user.name}</p>
                  </div>
                  <div className="w-9 h-9 bg-forest-700 border-2 border-forest-800 flex items-center
                                  justify-center text-paper-50 text-xs font-black uppercase
                                  transition-all group-hover:bg-forest-800"
                       style={{ boxShadow: '2px 2px 0 rgba(45,90,39,0.25)' }}>
                    {user.name?.charAt(0)}
                  </div>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-56 bg-paper border-2 border-forest-700/40 z-50"
                        style={{ boxShadow: '4px 4px 0 rgba(45,90,39,0.15)' }}
                      >
                        {/* Email header */}
                        <div className="px-4 py-3 border-b-2 border-paper-300">
                          <p className="text-[8px] uppercase tracking-widest text-ink-300 font-black mb-0.5">Logged in as</p>
                          <p className="text-xs font-bold text-ink-700 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-forest-100 text-forest-700 border border-forest-300">
                            {user.role}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link to={getDashboardPath()} onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest
                                       text-ink-500 hover:text-forest-700 hover:bg-forest-50 transition-colors">
                            <span>🌿</span> Dashboard
                          </Link>
                          <Link to="/profile" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest
                                       text-ink-500 hover:text-forest-700 hover:bg-forest-50 transition-colors">
                            <span>📋</span> Profile
                          </Link>
                          <Link to="/bookings" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest
                                       text-ink-500 hover:text-forest-700 hover:bg-forest-50 transition-colors">
                            <span>🎫</span> My Bookings
                          </Link>
                        </div>

                        <div className="border-t-2 border-paper-300">
                          <button onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest
                                       text-red-600 hover:bg-red-50 transition-colors">
                            ← Logout
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── MOBILE HAMBURGER ── */}
            <button
              className="md:hidden p-2 text-ink-500 hover:text-forest-700 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t-2 border-paper-300 bg-paper-50 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
                    isActive(to) ? 'text-forest-700' : 'text-ink-500 hover:text-forest-700'
                  }`}>
                  {label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="border-t border-paper-300 pt-3 mt-3">
                    <p className="text-[8px] uppercase tracking-widest text-ink-300 font-black mb-2">Account</p>
                    <Link to={getDashboardPath()} onClick={() => setMobileOpen(false)}
                      className="block py-2 text-[11px] font-black uppercase tracking-widest text-ink-500 hover:text-forest-700">
                      Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setMobileOpen(false)}
                      className="block py-2 text-[11px] font-black uppercase tracking-widest text-ink-500 hover:text-forest-700">
                      Profile
                    </Link>
                    <Link to="/bookings" onClick={() => setMobileOpen(false)}
                      className="block py-2 text-[11px] font-black uppercase tracking-widest text-ink-500 hover:text-forest-700">
                      My Bookings
                    </Link>
                    <button onClick={handleLogout}
                      className="block w-full text-left py-2 text-[11px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 mt-1">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-paper-300 pt-3 mt-3 flex gap-3">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline-forest text-[10px] py-2 flex-1 text-center">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-forest text-[10px] py-2 flex-1 text-center">
                    Join
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;