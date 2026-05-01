import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(data.bookings || []);
    } catch (err) {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel booking';
      toast.error(msg);
    }
  };

  const handleCardClick = (eventId, e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(`/events/${eventId}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const isPastEvent = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    const event = booking.eventId;
    if (!event) return false;
    
    const isPast = isPastEvent(event.date);
    const matchesTab = activeTab === 'upcoming' ? !isPast : isPast;
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    
    const matchesSearch = !searchQuery || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.ticketId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesCategory && matchesSearch;
  });

  const categories = ['all', ...new Set(bookings.map(b => b.eventId?.category).filter(Boolean))];

  return (
    <div className="page-wrapper py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Editorial Header */}
        <header className="mb-12 pl-8 border-l-4 border-forest-600">
          <p className="text-[10px] uppercase tracking-[0.5em] text-ink-500 mb-2 font-black">Member Portal</p>
          <h1 className="text-5xl md:text-6xl font-serif italic text-ink-900 leading-tight tracking-tight">
            Welcome, <br /> <span className="text-forest-700 not-italic">{user?.name || 'Member'}</span>
          </h1>
        </header>

        {/* Minimalist Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: 'TOTAL BOOKINGS', val: bookings.length, icon: '🎫' },
            { label: 'UPCOMING', val: bookings.filter(b => !isPastEvent(b.eventId?.date)).length, icon: '📅' },
            { label: 'PAST EVENTS', val: bookings.filter(b => isPastEvent(b.eventId?.date)).length, icon: '✨' }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -3 }}
              className="bg-paper border-2 border-paper-300 p-6 shadow-paper cursor-default"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <p className="text-[9px] uppercase tracking-[0.2em] text-ink-500 font-black">{stat.label}</p>
              </div>
              <p className="text-5xl font-serif italic text-ink-900 mt-2">{stat.val}</p>
            </motion.div>
          ))}
        </div>

        {/* Navigation / Filters */}
        <div className="bg-paper border-2 border-forest-700/20 p-4 mb-12 shadow-paper">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search precise entry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-paper-box pl-10 h-12"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-paper-box h-12 w-auto min-w-[180px] bg-white cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Classes' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <div className="flex border-2 border-paper-300 h-12">
              {['upcoming', 'past'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                  className={`px-6 py-0 flex items-center text-[10px] uppercase tracking-[0.25em] font-black transition-all ${
                    activeTab === tab ? 'bg-forest-700 text-paper px-8' : 'bg-paper-50 text-ink-500 hover:bg-paper-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {(searchQuery || filterCategory !== 'all') && (
              <button onClick={() => { setSearchQuery(''); setFilterCategory('all'); }} className="btn-ghost-forest h-12 border-none">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-paper-300 pb-4">
          <p className="text-xs font-black uppercase tracking-widest text-ink-500">
            <span className="text-forest-700 font-mono text-sm">{filteredBookings.length}</span> RECORDS FOUND
          </p>
          <button onClick={fetchBookings} className="text-[9px] uppercase tracking-widest font-black text-forest-700 hover:text-forest-800 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="-2 -2 28 28"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Sync Archive
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
              <div className="inline-block animate-spin h-10 w-10 border-4 border-paper-300 border-t-forest-700 rounded-full mb-4"></div>
              <p className="text-ink-500 font-black uppercase tracking-widest text-xs">Retrieving Vault...</p>
            </motion.div>
          ) : filteredBookings.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
              {filteredBookings.map(booking => {
                const event = booking.eventId;
                if (!event) return null;
                
                const isPast = isPastEvent(event.date);
                const canCancel = !isPast && booking.status === 'confirmed';
                const totalPrice = event.ticketPrice * booking.quantity;

                return (
                  <motion.div 
                    key={booking._id} layout
                    whileHover={{ scale: 1.005 }}
                    onClick={(e) => handleCardClick(event._id, e)}
                    className="group paper-card cursor-pointer flex flex-col md:flex-row shadow-sm hover:shadow-paper border-2 border-paper-300 hover:border-forest-700"
                  >
                    <div className="w-full md:w-32 h-32 bg-paper-200 border-b-2 md:border-b-0 md:border-r-2 border-paper-300 flex-shrink-0">
                      <img src={event.imageUrl || `https://picsum.photos/seed/${event._id}/200/200`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={event.title} />
                    </div>
                    
                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[9px] font-mono font-black text-forest-700 bg-forest-50 px-2 py-0.5 border border-forest-200">{booking.ticketId}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                            booking.status === 'confirmed' ? 'bg-forest-50 text-forest-700 border-forest-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {booking.status}
                          </span>
                        </div>

                        <h3 className="text-2xl font-serif italic text-ink-900 group-hover:text-forest-700 transition-colors mb-2 truncate">
                          {event.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-ink-500 uppercase tracking-widest font-black">
                          <span>{formatDate(event.date)}</span>
                          <span className="text-paper-300">|</span>
                          <span className="truncate">{event.location}</span>
                          <span className="text-paper-300">|</span>
                          <span>QTY: <span className="font-mono text-ink-900">{booking.quantity}</span></span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3 shrink-0 border-t-2 border-dashed border-paper-300 w-full md:w-auto md:border-none pt-4 md:pt-0">
                        <p className="text-2xl font-serif italic text-ink-900">
                          {event.ticketPrice === 0 ? 'Complimentary' : `₹${totalPrice.toLocaleString()}`}
                        </p>
                        
                        <div className="flex gap-2">
                          {canCancel && (
                            <button onClick={(e) => handleCancelBooking(booking._id, e)} className="btn-ghost-forest text-[9px] px-3 py-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">Cancel</button>
                          )}
                          <Link to={`/bookings/${booking._id}`} onClick={(e) => e.stopPropagation()} className="btn-outline-forest text-[9px] px-4 py-1.5 shadow-none border-forest-600">🎫 Ticket</Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center border-2 border-dashed border-paper-300 bg-paper">
              <span className="text-4xl inline-block mb-4 opacity-50">🎫</span>
              <p className="text-ink-900 font-serif italic mb-2 text-2xl">
                {searchQuery || filterCategory !== 'all' ? 'Archive query returned void' : 'Your vault is currently empty'}
              </p>
              <p className="text-ink-500 text-sm mb-8 font-sans">
                {searchQuery || filterCategory !== 'all' ? 'Try adjusting your filters' : 'Discover your next unforgettable experience in the registry.'}
              </p>
              <Link to="/events" className="btn-forest">Access Registry</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserDashboard;