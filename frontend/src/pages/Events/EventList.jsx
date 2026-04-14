import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/axios';
import StarRating from '../../components/ui/StarRating';

// ── HELPERS ──────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'TBA';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const truncate = (str, len = 30) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

const getSeatStatus = (available, total) => {
  if (!total) return { label: 'Closed', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  const percent = (available / total) * 100;
  if (percent === 0) return { label: 'Sold Out', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  if (percent < 20) return { label: 'Few Left', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { label: 'Available', color: 'text-forest-700', bg: 'bg-forest-100', border: 'border-forest-300' };
};

// ── ICONS ────────────────────────────────────────────────────────────────
const SearchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const CalendarIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const LocationIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>;
const FilterIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>;
const UserIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;

// ── COMPONENTS ───────────────────────────────────────────────────────────
const EventCard = ({ event }) => {
  const status = getSeatStatus(event.availableSeats, event.totalSeats);
  const occupancy = event.totalSeats ? Math.round(((event.totalSeats - event.availableSeats) / event.totalSeats) * 100) : 0;
  const orgRating = event.organizerId?.avgRating || 0;
  const eventRating = event.avgEventRating || 0;

  return (
    <Link to={`/events/${event._id}`} className="group paper-card flex flex-col h-full bg-paper block no-underline text-ink-900 border-2 border-transparent hover:border-forest-700">
      <div className="relative h-56 overflow-hidden border-b-2 border-paper-300">
        <img
          src={event.imageUrl || `https://picsum.photos/seed/${event._id}/600/400`}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&h=400&auto=format&fit=crop'; }}
        />
        <div className="absolute inset-0 bg-forest-900/10 group-hover:bg-transparent transition-colors" />
        <div className={`absolute top-4 right-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.color} border ${status.border} shadow-sm`}>
          {status.label}
        </div>
        {/* Event rating badge */}
        {eventRating > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-paper/90 backdrop-blur-sm px-2 py-1 border border-paper-300 shadow-sm">
            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="font-mono text-[10px] font-bold text-ink-700">{Number(eventRating).toFixed(1)}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-ink-400">event</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-2xl font-serif italic text-ink-900 mb-3 group-hover:text-forest-700 transition-colors line-clamp-1">{event.title}</h3>

        {/* Organizer row with rating */}
        {event.organizerId?.name && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dashed border-paper-300">
            <UserIcon />
            <span className="text-[11px] font-black uppercase tracking-widest text-ink-500">
              {event.organizerId.name}
            </span>
            {orgRating > 0 && (
              <span className="ml-auto flex items-center gap-1">
                <StarRating value={orgRating} readOnly size="sm" />
              </span>
            )}
            {orgRating === 0 && (
              <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-ink-300">New</span>
            )}
          </div>
        )}

        <div className="space-y-3 mb-6 flex-1">
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <CalendarIcon /> <span className="font-sans">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <LocationIcon /> <span className="font-sans">{truncate(event.location, 35)}</span>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-paper-300 border-dashed">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] uppercase tracking-widest text-ink-500 font-black">Booking Status</span>
            <span className="text-[10px] text-forest-700 font-black font-mono">{occupancy}%</span>
          </div>
          <div className="w-full h-1.5 bg-paper-200 border border-paper-300 overflow-hidden">
            <div className="h-full bg-forest-600 transition-all duration-1000" style={{ width: `${occupancy}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
};

// Rating filter options
const RATING_FILTERS = [
  { label: 'Any Rating', value: '' },
  { label: '3★ & up', value: '3' },
  { label: '4★ & up', value: '4' },
  { label: '4.5★ & up', value: '4.5' },
];

const EventList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    minRating: searchParams.get('minRating') || '',
  });

  const [inputSearch, setInputSearch] = useState(filters.search);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      const { data } = await api.get('/events', { params });
      setEvents(data.data || []);
      setPagination({ page: data.page || 1, pages: data.pages || 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const clean = { ...filters, page };
    setSearchParams(Object.fromEntries(Object.entries(clean).filter(([_, v]) => v && v !== '1')));
    fetchEvents();
  }, [filters, page, fetchEvents, setSearchParams]);

  return (
    <div className="page-wrapper pb-24">
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 px-4 bg-paper-50 border-b-2 border-paper-300 overflow-hidden text-center">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: `linear-gradient(#1A1A12 1px, transparent 1px), linear-gradient(90deg, #1A1A12 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <p className="section-label">Archive Registry</p>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight text-ink-900 leading-tight">
            Discover <span className="text-forest-700 not-italic">Extraordinary</span> Events.
          </h1>
          <p className="text-lg text-ink-500 max-w-2xl mx-auto font-sans leading-relaxed">
            From exclusive summits to private gatherings, search the registry to secure your attendance.
          </p>

          {/* Search Bar */}
          <form onSubmit={(e) => { e.preventDefault(); setFilters(f => ({ ...f, search: inputSearch })); setPage(1); }} className="relative max-w-2xl mx-auto mt-10">
            <div className="relative flex items-center bg-paper border-2 border-forest-700 shadow-paper p-1 pl-4">
              <span className="text-forest-700"><SearchIcon /></span>
              <input
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg outline-none font-serif italic text-ink-900 placeholder:text-ink-300"
                placeholder="Search by event title..."
                value={inputSearch}
                onChange={e => setInputSearch(e.target.value)}
              />
              <button type="submit" className="btn-forest">Find</button>
            </div>
          </form>
        </div>
      </section>

      {/* ── FILTER & CONTENT SECTION ──────────────────────────────────── */}
      <div className="container-paper mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b-2 border-paper-300 pb-6">
          <h2 className="text-3xl font-serif italic text-ink-900 flex items-center gap-4">
            <span className="w-12 h-0.5 bg-forest-600 block" />
            Upcoming Experiences
          </h2>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 transition-all ${showFilters ? 'bg-forest-700 border-forest-700 text-paper-50 shadow-paper' : 'border-paper-300 text-ink-700 hover:border-forest-700'}`}
          >
            <FilterIcon /> <span>{showFilters ? 'Hide Filters' : 'Refine Search'}</span>
          </button>
        </div>

        {showFilters && (
          <div className="mb-12 p-8 bg-paper border-2 border-forest-700/20 shadow-paper animate-slideUp space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-ink-500 font-black ml-1">Location</label>
                <input className="input-paper-box" placeholder="Any City" value={filters.location} onChange={e => { setFilters(f => ({ ...f, location: e.target.value })); setPage(1); }} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-ink-500 font-black ml-1">From Date</label>
                <input type="date" className="input-paper-box" value={filters.fromDate} onChange={e => { setFilters(f => ({ ...f, fromDate: e.target.value })); setPage(1); }} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-ink-500 font-black ml-1">To Date</label>
                <input type="date" className="input-paper-box" value={filters.toDate} onChange={e => { setFilters(f => ({ ...f, toDate: e.target.value })); setPage(1); }} />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilters({ search: '', location: '', fromDate: '', toDate: '', minRating: '' }); setInputSearch(''); setPage(1); }}
                  className="w-full py-3.5 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Min Rating filter row */}
            <div className="space-y-2 border-t-2 border-dashed border-paper-300 pt-5">
              <p className="text-[9px] uppercase tracking-widest text-ink-500 font-black">Min. Organiser Rating</p>
              <div className="flex flex-wrap gap-2">
                {RATING_FILTERS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilters(f => ({ ...f, minRating: opt.value })); setPage(1); }}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-1.5 ${
                      filters.minRating === opt.value
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-paper border-paper-300 text-ink-500 hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >
                    {opt.value ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {opt.label}
                      </>
                    ) : opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GRID ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-paper-200 h-96 border-2 border-paper-300 animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map(event => <EventCard key={event._id} event={event} />)}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center mt-16 pb-8">
                <div className="inline-flex items-center gap-6 bg-paper border-2 border-forest-700/20 p-2 shadow-paper">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border-2 border-transparent hover:border-forest-700 disabled:opacity-30 transition-all text-ink-500 hover:text-forest-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink-700">PAGE <span className="font-mono">{page}</span> / <span className="font-mono">{pagination.pages}</span></span>
                  <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="p-2 border-2 border-transparent hover:border-forest-700 disabled:opacity-30 transition-all text-ink-500 hover:text-forest-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center bg-paper border-2 border-paper-300 border-dashed">
            <div className="mb-6 inline-flex justify-center items-center w-16 h-16 bg-paper-100 border-2 border-forest-700 text-forest-700 shadow-paper">
              <SearchIcon />
            </div>
            <h3 className="text-3xl font-serif italic text-ink-900 mb-3">No matches found</h3>
            <p className="text-ink-500 font-sans">Try adjusting your search criteria or explore our other collections.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;