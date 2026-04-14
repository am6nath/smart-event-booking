import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

const Booking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  const qtyParam = Math.min(parseInt(searchParams.get('qty')) || 1, 10);
  const [quantity, setQuantity] = useState(qtyParam);

  // Auth guard
  useEffect(() => {
    if (!user) navigate('/login', { state: { from: `/booking/${id}` } });
  }, [user, navigate, id]);

  // Fetch event
  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/events/${id}`);
        const evt = data.data;
        setEvent(evt);
        if (qtyParam > evt.availableSeats) setQuantity(evt.availableSeats);
      } catch {
        setError('Event not found or unavailable.');
        toast.error('Event not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, qtyParam]);

  const handleConfirm = async () => {
    if (!event || submitting) return;
    if (quantity < 1 || quantity > 10) { toast.warning('Between 1–10 tickets only.'); return; }
    if (quantity > event.availableSeats) { toast.warning('Not enough seats.'); return; }

    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', { eventId: id, quantity });
      toast.success(data.message || 'Booking confirmed! 🎉');
      // Go straight to the booking detail / ticket page
      navigate(`/bookings/${data.booking._id}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      toast.error(msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-paper-300 border-t-forest-700 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-400">Loading details…</p>
        </div>
      </div>
    );
  }

  /* ── Event not found ── */
  if (error && !event) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-md paper-card border-2 border-red-200 p-12">
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="text-2xl font-serif italic font-bold text-ink-900 mb-2">Booking Unavailable</h2>
          <p className="text-ink-500 text-sm font-sans mb-8">{error}</p>
          <Link to="/events" className="btn-forest">Browse Events</Link>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const totalPrice   = event.ticketPrice * quantity;
  const maxQty       = Math.min(10, event.availableSeats);
  const isFree       = event.ticketPrice === 0;

  return (
    <div className="page-wrapper py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-5xl mx-auto">

        {/* ── Breadcrumb ── */}
        <div className="mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
          <Link to="/events" className="text-ink-400 hover:text-forest-700 transition-colors">Events</Link>
          <span className="text-ink-300">/</span>
          <Link to={`/events/${id}`} className="text-ink-400 hover:text-forest-700 transition-colors truncate max-w-[160px]">{event.title}</Link>
          <span className="text-ink-300">/</span>
          <span className="text-forest-700">Checkout</span>
        </div>

        {/* ── Main card (two-pane) ── */}
        <div className="flex flex-col lg:flex-row border-2 border-forest-700 shadow-paper bg-paper overflow-hidden">

          {/* LEFT — Event Summary ─────────────────────── */}
          <div className="lg:w-2/5 bg-forest-900 p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">

            {/* Subtle paper texture grid */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                 style={{ backgroundImage: 'linear-gradient(#FAF7F0 1px,transparent 1px),linear-gradient(90deg,#FAF7F0 1px,transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Corner marks */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-forest-600/50" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-forest-600/50" />

            <div className="relative z-10">
              <span className="inline-block bg-forest-600 text-paper-50 text-[9px] font-black px-3 py-1.5 uppercase tracking-[0.2em] mb-5">
                {event.category}
              </span>
              <h2 className="text-2xl lg:text-3xl font-serif italic font-bold text-paper leading-tight mb-3">
                {event.title}
              </h2>
              <p className="text-forest-200 text-sm font-sans leading-relaxed line-clamp-3 mb-6 opacity-80">
                {event.description}
              </p>

              <div className="space-y-3">
                {[
                  { icon: '📅', text: fmt(event.date) },
                  { icon: '📍', text: event.location },
                  { icon: '🎟️', text: isFree ? 'Free Entry' : `₹${event.ticketPrice} per ticket` },
                  { icon: '💺', text: `${event.availableSeats} seats remaining` },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-base w-5 flex-shrink-0">{icon}</span>
                    <span className="text-sm font-sans text-forest-100">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-forest-700">
              <p className="text-[9px] uppercase tracking-[0.3em] text-forest-500 font-black mb-1">Organised by</p>
              <p className="text-sm font-serif italic text-forest-200">
                {event.organizerId?.name || 'EventHub Organizer'}
              </p>
            </div>
          </div>

          {/* RIGHT — Booking Form ─────────────────────── */}
          <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">

            <div className="mb-8">
              <p className="section-label mb-1">Ticket Checkout</p>
              <h3 className="text-3xl font-serif italic font-bold text-ink-900">Confirm Your Entry</h3>
            </div>

            {/* Attendee */}
            <div className="bg-forest-50 border border-forest-200 p-4 mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-forest-700 border-2 border-forest-800 flex items-center justify-center text-paper-50 font-serif italic text-lg font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-forest-600 mb-0.5">Booking For</p>
                <p className="font-serif italic font-semibold text-ink-900">{user?.name}</p>
                <p className="text-[10px] text-ink-500 font-mono">{user?.email}</p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mb-6">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-ink-500 block mb-3">
                Number of Tickets
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-11 h-11 border-2 border-forest-700 text-forest-700 font-bold text-xl flex items-center justify-center hover:bg-forest-700 hover:text-paper transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >−</button>

                <input
                  type="number"
                  min={1} max={maxQty}
                  value={quantity}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(Math.max(1, v), maxQty));
                  }}
                  className="w-16 h-11 text-center text-xl font-bold font-serif italic text-ink-900 input-paper-box"
                />

                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="w-11 h-11 border-2 border-forest-700 text-forest-700 font-bold text-xl flex items-center justify-center hover:bg-forest-700 hover:text-paper transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >+</button>

                <span className="text-[10px] text-ink-400 font-black uppercase tracking-widest ml-2">
                  {event.availableSeats} left
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="border-2 border-dashed border-paper-300 p-5 mb-6 bg-paper-50">
              <div className="flex justify-between text-sm font-sans mb-2">
                <span className="text-ink-500">
                  {isFree ? 'Free' : `₹${event.ticketPrice}`} × {quantity} ticket{quantity > 1 ? 's' : ''}
                </span>
                <span className="font-bold text-ink-700">{isFree ? 'Free' : `₹${event.ticketPrice * quantity}`}</span>
              </div>
              <div className="flex justify-between text-sm font-sans mb-3 pb-3 border-b border-paper-300">
                <span className="text-ink-500">Service fee</span>
                <span className="font-bold text-ink-700">₹0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-700">Total</span>
                <span className="text-3xl font-serif italic font-bold text-forest-700">
                  {isFree ? 'Free' : `₹${totalPrice}`}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-widest px-4 py-2 mb-4">
                ⚠ {error}
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={submitting || quantity > event.availableSeats}
              className="btn-forest w-full py-5 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Securing your tickets…
                </span>
              ) : (
                isFree ? 'Reserve Free Tickets' : `Confirm & Pay ₹${totalPrice}`
              )}
            </button>

            <p className="text-center text-[9px] text-ink-400 font-sans mt-4 uppercase tracking-widest">
              Cancellations not allowed within 24h of the event
            </p>
          </div>
        </div>

        {/* ── Back link ── */}
        <div className="mt-6">
          <Link
            to={`/events/${id}`}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-400 hover:text-forest-700 transition-colors inline-flex items-center gap-2"
          >
            ← Back to Event
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Booking;