import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/axios';
import { toast } from 'react-toastify';
import StarRating from '../../components/ui/StarRating';

// ── Review Modal ──────────────────────────────────────────────────────────
const ReviewModal = ({ booking, onClose, onSubmitted }) => {
  const [eventRating, setEventRating] = useState(0);
  const [eventComment, setEventComment] = useState('');
  const [organizerRating, setOrganizerRating] = useState(0);
  const [organizerComment, setOrganizerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventRating || !organizerRating) {
      toast.error('Please provide both ratings before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${booking.eventId._id}`, {
        eventRating,
        eventComment,
        organizerRating,
        organizerComment
      });
      toast.success('Review submitted! Thank you for your feedback.');
      onSubmitted(booking._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const ev = booking.eventId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-paper border-2 border-forest-700 shadow-paper max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b-2 border-forest-700 bg-forest-50 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-forest-600 mb-1">Write A Review</p>
            <h2 className="text-xl font-serif italic font-bold text-forest-900 line-clamp-1">{ev?.title}</h2>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-red-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Event Rating */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-paper-300 pb-2">
              <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-700">Rate the Event</h3>
            </div>
            <div className="flex items-center gap-4">
              <StarRating value={eventRating} onChange={setEventRating} size="lg" />
              {eventRating > 0 && <span className="text-sm font-black text-ink-600">{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][eventRating]}</span>}
            </div>
            <textarea
              value={eventComment}
              onChange={e => setEventComment(e.target.value)}
              placeholder="Share your experience about the event… (optional)"
              className="input-paper-box w-full resize-none h-20 !text-sm"
              maxLength={500}
            />
          </div>

          {/* Organizer Rating */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-paper-300 pb-2">
              <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-700">Rate the Organiser</h3>
              {ev?.organizerId?.name && <span className="text-[9px] font-black text-ink-400 uppercase tracking-widest">· {ev.organizerId.name}</span>}
            </div>
            <div className="flex items-center gap-4">
              <StarRating value={organizerRating} onChange={setOrganizerRating} size="lg" />
              {organizerRating > 0 && <span className="text-sm font-black text-ink-600">{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][organizerRating]}</span>}
            </div>
            <textarea
              value={organizerComment}
              onChange={e => setOrganizerComment(e.target.value)}
              placeholder="How was the organiser's performance? (optional)"
              className="input-paper-box w-full resize-none h-20 !text-sm"
              maxLength={500}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !eventRating || !organizerRating}
            className="btn-forest w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null); // booking object
  const [reviewedIds, setReviewedIds] = useState(new Set());

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/my');
      const bks = data.bookings || [];
      setBookings(bks);

      // Check which past bookings already have a review
      const pastConfirmed = bks.filter(b => b.status === 'confirmed' && new Date(b.eventId?.date) < new Date());
      const checks = await Promise.all(
        pastConfirmed.map(b =>
          api.get(`/reviews/check/${b.eventId._id}`).then(r => r.data.hasReviewed ? b._id : null).catch(() => null)
        )
      );
      setReviewedIds(new Set(checks.filter(Boolean)));
    } catch {
      toast.error('Registry could not be retrieved.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Strike this entry from the registry?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Access Revoked.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  const handleReviewSubmitted = (bookingId) => {
    setReviewedIds(prev => new Set([...prev, bookingId]));
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-stone-900 py-20 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* ── HEADER ── */}
        <div className="mb-12 space-y-2">
          <h1 className="text-5xl font-serif italic tracking-tighter text-[#1A2C26]">Your Registry</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
            Secure Access Logs · {bookings.length} Active Entries
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-40 gap-4">
            <div className="w-10 h-10 border-t-2 border-stone-900 rounded-full animate-spin" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Fetching Logs...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-stone-200">
            <p className="font-serif italic text-2xl text-stone-300 mb-6">The archive is currently empty.</p>
            <Link to="/events" className="text-[10px] font-black uppercase tracking-[0.3em] bg-[#1A2C26] text-[#E2F1AF] px-8 py-4 hover:bg-black transition-all">
              Discover Events
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((b) => {
              const ev = b.eventId;
              if (!ev) return null;
              const isPast = new Date(ev.date) < new Date();
              const canReview = isPast && b.status === 'confirmed';
              const alreadyReviewed = reviewedIds.has(b._id);

              return (
                <div key={b._id} className="group relative bg-white border border-stone-200 flex flex-col md:flex-row overflow-hidden hover:border-stone-400 transition-colors shadow-sm">

                  {/* Visual Stub */}
                  <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden bg-stone-100 transition-all duration-700">
                    <img src={ev.imageUrl || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Content Archive */}
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-stone-100 px-2 py-1">
                          {ev.category}
                        </span>
                        <div className="flex items-center gap-3">
                          {isPast && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-50 border border-stone-200 px-2 py-0.5">
                              Past Event
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            b.status === 'confirmed' ? 'text-emerald-700' : 'text-stone-400'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                      <h2 className="font-serif italic text-3xl text-[#1A2C26] mb-1">{ev.title}</h2>
                      <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                        {new Date(ev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} · {ev.location}
                      </p>
                    </div>

                    <div className="mt-6 flex items-end justify-between border-t border-stone-100 pt-5">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em]">Unique Identifier</p>
                        <p className="font-mono text-[10px] text-stone-600 tracking-tighter uppercase">{b.ticketId}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="text-right">
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em]">Quantity</p>
                          <p className="font-serif italic text-xl">x{b.quantity}</p>
                        </div>

                        {/* Rate button for past events */}
                        {canReview && (
                          alreadyReviewed ? (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-700">
                              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              Reviewed
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewModal(b)}
                              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              Rate Event
                            </button>
                          )
                        )}

                        <Link
                          to={`/bookings/${b._id}`}
                          className="bg-stone-900 text-white p-3 hover:bg-red-900 transition-colors"
                          title="View Digital Ticket"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Action — only for upcoming confirmed */}
                  {b.status === 'confirmed' && !isPast && (
                    <button
                      onClick={() => cancel(b._id)}
                      className="absolute top-4 right-4 text-stone-300 hover:text-red-700 transition-colors"
                      title="Cancel Access"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default MyBookings;