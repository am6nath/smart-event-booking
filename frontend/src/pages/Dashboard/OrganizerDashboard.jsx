import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── tiny helpers ─── */
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ─── Status badge helper ─── */
const statusClass = {
  draft:     'bg-paper-200 text-ink-700 border-paper-300',
  pending:   'bg-amber-50  text-amber-700 border-amber-200',
  approved:  'bg-forest-50 text-forest-700 border-forest-200',
  rejected:  'bg-red-50    text-red-700  border-red-200',
  cancelled: 'bg-red-50    text-red-700  border-red-200',
  completed: 'bg-forest-900 text-paper   border-forest-950',
  confirmed: 'bg-forest-50 text-forest-700 border-forest-200',
};
const getStatusBadge = (s) => statusClass[s] || 'bg-paper-200 text-ink-700 border-paper-300';

/* ══════════════════════════════════════════════════════════
   EVENTS TAB
══════════════════════════════════════════════════════════ */
const EventsTab = ({ events, loading, onDelete, onRequestUpdate }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const filtered = filterStatus === 'all' ? events : events.filter(e => e.status === filterStatus);

  return (
    <div className="bg-paper border-2 border-forest-700 shadow-paper">
      {/* toolbar */}
      <div className="p-6 border-b-2 border-forest-700 bg-forest-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-serif italic font-bold text-forest-900">Event Index</h2>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-paper-box !py-2 !px-4 w-full md:w-auto bg-paper cursor-pointer !text-[11px] !font-black !uppercase !tracking-[0.2em]"
        >
          <option value="all">Complete Archive</option>
          <option value="pending">Under Review</option>
          <option value="approved">Approved</option>
          <option value="draft">Drafts</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-10 h-10 border-4 border-paper-300 border-t-forest-700 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <table className="paper-table">
            <thead className="bg-paper-50 !border-b-2 !border-forest-700">
              <tr>
                {['Event Profile','Timeline','State','Allocated','Revenue Log','Actions'].map(h => (
                  <th key={h} className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-dashed divide-paper-300">
              {filtered.map(event => (
                <tr key={event._id} className="hover:bg-paper-100 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border-2 border-paper-300 overflow-hidden flex-shrink-0 bg-paper">
                        <img src={event.imageUrl || '/assets/event-placeholder.svg'} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-serif italic font-bold text-lg text-ink-900">{event.title}</p>
                        <p className="text-[10px] font-sans text-ink-500 truncate max-w-[150px]">{event.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono font-bold text-ink-700">{fmt(event.date)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono font-bold text-ink-700">
                    {event.bookedSeats || 0} / {event.totalSeats}
                  </td>
                  <td className="px-6 py-4 text-sm font-sans font-bold text-forest-700">
                    ₹{(event.revenue || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {event.status === 'rejected' ? (
                      <button
                        onClick={() => alert(`Admin Rejection Reason:\n\n${event.rejectionReason || 'No defined reason was recorded.'}`)}
                        className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-black uppercase tracking-widest text-[9px] px-3 py-1 transition-all"
                      >View Reason</button>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/events/${event._id}`} className="btn-outline-forest !text-[9px] !px-3 !py-1 !shadow-none">
                          Read
                        </Link>
                        {event.status === 'approved' ? (
                          event.editRequestStatus === 'approved' ? (
                            <Link to={`/events/${event._id}/edit`} className="bg-paper border border-forest-600 text-forest-700 hover:bg-forest-50 font-black uppercase tracking-widest text-[9px] px-3 py-1 transition-all">Amend</Link>
                          ) : event.editRequestStatus === 'pending' ? (
                            <button disabled className="bg-paper-100 border border-paper-300 text-ink-300 font-black uppercase tracking-widest text-[9px] px-3 py-1 cursor-not-allowed">Requested</button>
                          ) : (
                            <button onClick={() => onRequestUpdate(event._id)} className="bg-paper border border-amber-600 text-amber-700 hover:bg-amber-50 font-black uppercase tracking-widest text-[9px] px-3 py-1 transition-all" title="Request Edit Access from Admin">Req. Amend</button>
                          )
                        ) : (
                          <Link to={`/events/${event._id}/edit`} className="bg-paper border border-ink-300 text-ink-700 hover:text-ink-900 hover:border-ink-500 font-black uppercase tracking-widest text-[9px] px-3 py-1 transition-all">Amend</Link>
                        )}
                        <button onClick={() => onDelete(event._id)} className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-black uppercase tracking-widest text-[9px] px-3 py-1 transition-all">Purge</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center bg-paper">
            <span className="text-4xl opacity-40 block mb-4">🗂️</span>
            <p className="text-ink-900 font-serif italic text-xl mb-2">No archive entries located</p>
            <p className="text-ink-500 font-sans text-sm mb-6">You have no active or drafted events in the registry.</p>
            <Link to="/events/create" className="btn-forest">Draft First Entry</Link>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ATTENDEES TAB
══════════════════════════════════════════════════════════ */
const AttendeesTab = () => {
  const [attendees, setAttendees]     = useState([]);
  const [myEvents, setMyEvents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [totalCount, setTotalCount]   = useState(0);
  const [pagination, setPagination]   = useState({ page: 1, pages: 1 });

  // Filters
  const [search, setSearch]           = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setStatus]     = useState('');
  const [page, setPage]               = useState(1);

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search.trim())  params.set('search', search.trim());
      if (filterEvent)    params.set('eventId', filterEvent);
      if (filterStatus)   params.set('status',  filterStatus);

      const { data } = await api.get(`/organizers/my/attendees?${params}`);
      setAttendees(data.attendees || []);
      setTotalCount(data.count    || 0);
      setMyEvents(data.events     || []);
      setPagination(data.pagination || { page: 1, pages: 1 });
    } catch {
      toast.error('Failed to load attendees');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterEvent, filterStatus]);

  useEffect(() => { fetchAttendees(); }, [fetchAttendees]);

  /* reset page when filters change */
  useEffect(() => { setPage(1); }, [search, filterEvent, filterStatus]);

  return (
    <div className="space-y-6">
      {/* ── Quick Stats Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="paper-card p-5 border-2 border-forest-700/30">
          <p className="section-label mb-1">Total Bookings</p>
          <p className="text-3xl font-serif italic text-forest-700">{totalCount}</p>
        </div>
        <div className="paper-card p-5 border-2 border-forest-700/30">
          <p className="section-label mb-1">Confirmed</p>
          <p className="text-3xl font-serif italic text-forest-700">
            {attendees.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
        <div className="paper-card p-5 border-2 border-red-200 col-span-2 md:col-span-1">
          <p className="section-label mb-1 !text-red-500">Cancelled</p>
          <p className="text-3xl font-serif italic text-red-600">
            {attendees.filter(a => a.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-forest-50 border-2 border-forest-700 p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email or ticket ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-paper-box !pl-9 !py-2 !text-sm w-full bg-paper"
          />
        </div>

        {/* Event filter */}
        <select
          value={filterEvent}
          onChange={e => setFilterEvent(e.target.value)}
          className="input-paper-box !py-2 !px-3 w-full md:w-56 bg-paper !text-[11px] !font-black !uppercase !tracking-[0.15em] cursor-pointer"
        >
          <option value="">All Events</option>
          {myEvents.map(ev => (
            <option key={ev._id} value={ev._id}>{ev.title}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setStatus(e.target.value)}
          className="input-paper-box !py-2 !px-3 w-full md:w-40 bg-paper !text-[11px] !font-black !uppercase !tracking-[0.15em] cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-paper border-2 border-forest-700 shadow-paper overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-paper-300 border-t-forest-700 rounded-full animate-spin" />
            <p className="text-ink-500 font-sans text-sm">Loading attendees…</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-5xl opacity-30 block mb-4">👥</span>
            <p className="font-serif italic text-xl text-ink-900 mb-2">No attendees found</p>
            <p className="text-ink-500 text-sm font-sans">
              {search || filterEvent || filterStatus
                ? 'Try adjusting your filters.'
                : 'No one has booked your events yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="paper-table">
              <thead className="bg-paper-50">
                <tr>
                  {['Attendee','Contact','Event','Ticket ID','Seats','Status','Booked On'].map(h => (
                    <th key={h} className="!text-[9px] !font-black !tracking-[0.2em] !text-ink-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendees.map((a, i) => (
                  <tr
                    key={a.bookingId}
                    className="hover:bg-forest-50/60 transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Attendee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar initials */}
                        <div
                          className="w-9 h-9 flex-shrink-0 flex items-center justify-center font-serif italic font-bold text-sm border-2 border-forest-200 text-forest-700"
                          style={{ background: 'var(--forest-50)' }}
                        >
                          {a.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="font-sans font-semibold text-sm text-ink-900 whitespace-nowrap">
                          {a.user?.name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Contact — read-only */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-ink-600 select-all">
                        {a.user?.email || '—'}
                      </span>
                    </td>

                    {/* Event */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-serif italic font-semibold text-sm text-ink-900 leading-tight max-w-[160px] truncate">
                          {a.event?.title || '—'}
                        </p>
                        <p className="text-[10px] font-sans text-ink-400 mt-0.5">{a.event?.date ? fmt(a.event.date) : ''}</p>
                      </div>
                    </td>

                    {/* Ticket ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] font-bold tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5">
                        {a.ticketId}
                      </span>
                    </td>

                    {/* Seats */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-sm text-ink-700">{a.quantity}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest ${getStatusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>

                    {/* Booked On */}
                    <td className="px-4 py-3 text-[10px] font-mono text-ink-500 whitespace-nowrap">
                      {fmtTime(a.bookedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t-2 border-dashed border-paper-300 bg-paper-50">
            <p className="text-[11px] font-sans text-ink-500">
              Page <span className="font-bold text-ink-700">{pagination.page}</span> of{' '}
              <span className="font-bold text-ink-700">{pagination.pages}</span>
              {' '}·{' '}<span className="font-bold text-ink-700">{totalCount}</span> total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="btn-outline-forest !text-[9px] !px-3 !py-1.5 !shadow-none disabled:opacity-40"
              >← Prev</button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, pagination.pages))}
                disabled={page >= pagination.pages}
                className="btn-forest !text-[9px] !px-3 !py-1.5 disabled:opacity-40"
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState('events'); // 'events' | 'attendees'

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events/organizer/my');
      setEvents(data.data || []);
    } catch {
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure? This will delete all associated bookings.')) return;
    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleRequestUpdate = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/request-update`);
      toast.success('Update access requested from admin');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request update access');
    }
  };

  /* aggregate stats */
  const approvedCount  = events.filter(e => e.status === 'approved').length;
  const pendingCount   = events.filter(e => e.status === 'pending').length;
  const totalRevenue   = events.reduce((acc, e) => acc + (e.revenue || 0), 0);

  const TABS = [
    { key: 'events',    label: 'Event Index',     icon: '🗂️'  },
    { key: 'attendees', label: 'Attendee Registry', icon: '👥'  },
  ];

  return (
    <div className="page-wrapper py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b-2 border-forest-700 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-ink-500 mb-2 font-black">Curator Panel</p>
            <h1 className="text-4xl md:text-5xl font-serif italic font-bold text-ink-900 mb-1">Curation Dashboard</h1>
            <p className="text-sm font-sans text-ink-500">
              Welcome back, <span className="font-semibold text-ink-700">{user?.name}</span>
            </p>
          </div>
          <Link to="/events/create" className="btn-forest flex items-center justify-center gap-3 w-full md:w-auto shadow-paper">
            <svg className="w-5 h-5 border border-paper rounded-none p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Draft Entry
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="paper-card p-6 border-2 border-paper-300">
            <p className="section-label mb-2">Total Events</p>
            <p className="text-4xl font-serif italic text-ink-900">{events.length}</p>
          </div>
          <div className="paper-card p-6 border-2 border-forest-700/30">
            <p className="section-label mb-2">Approved</p>
            <p className="text-4xl font-serif italic text-forest-700">{approvedCount}</p>
          </div>
          <div className="paper-card p-6 border-2 border-amber-600/30">
            <p className="section-label mb-2">Pending</p>
            <p className="text-4xl font-serif italic text-amber-700">{pendingCount}</p>
          </div>
          <div className="paper-card p-6 border-2 border-forest-700 bg-forest-50 shadow-paper">
            <p className="section-label mb-2">Total Ledger</p>
            <p className="text-3xl font-serif italic font-bold text-forest-900">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex border-b-2 border-forest-700 mb-8 gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'relative px-6 py-3 font-sans text-[11px] font-black uppercase tracking-[0.2em] transition-all',
                activeTab === t.key
                  ? 'bg-forest-700 text-paper -mb-[2px] border-2 border-forest-700'
                  : 'text-ink-500 hover:text-forest-700 hover:bg-forest-50 border-2 border-transparent',
              ].join(' ')}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'events' ? (
          <EventsTab
            events={events}
            loading={loading}
            onDelete={handleDeleteEvent}
            onRequestUpdate={handleRequestUpdate}
          />
        ) : (
          <AttendeesTab />
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;