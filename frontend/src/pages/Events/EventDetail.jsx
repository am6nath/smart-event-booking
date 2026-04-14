import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/axios'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/ui/StarRating'

// ── HELPERS ──────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'TBA';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
};

const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 border-2 shadow-paper font-sans text-xs uppercase tracking-widest font-black transition-all duration-500 ${
    type === 'success' ? 'bg-forest-50 border-forest-600 text-forest-700' :
    type === 'error'   ? 'bg-red-50 border-red-600 text-red-700' :
    'bg-paper border-ink-900 text-ink-900'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 10px)';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
};

// ── Review Card ──────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => (
  <div className="py-5 border-b-2 border-dashed border-paper-300 last:border-0">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-forest-50 border-2 border-forest-700 flex items-center justify-center font-serif italic text-forest-800 font-bold text-sm">
          {review.userId?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-bold text-ink-900 text-sm font-sans">{review.userId?.name || 'Anonymous'}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-ink-400">
            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-ink-400 mb-1">Event</p>
          <StarRating value={review.eventRating} readOnly size="sm" />
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-ink-400 mb-1">Organiser</p>
          <StarRating value={review.organizerRating} readOnly size="sm" />
        </div>
      </div>
    </div>
    {review.eventComment && (
      <p className="text-sm text-ink-600 font-sans leading-relaxed italic ml-11">&ldquo;{review.eventComment}&rdquo;</p>
    )}
  </div>
);

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [hasBooked, setHasBooked] = useState(false)
  const [reviews, setReviews] = useState([])
  const [avgEventRating, setAvgEventRating] = useState(0)

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop';
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const { data } = await api.get(`/events/${id}`)
        setEvent(data.data)

        if (isLoggedIn && user?.id) {
          try {
            const { data: userBookings } = await api.get('/bookings/my')
            const alreadyBooked = userBookings.bookings?.some(
              b => b.eventId?._id === id && b.status === 'confirmed'
            )
            setHasBooked(alreadyBooked || false)
          } catch (err) { setHasBooked(false) }
        }

        // Fetch event reviews
        try {
          const { data: reviewData } = await api.get(`/reviews/event/${id}`)
          setReviews(reviewData.reviews || [])
          setAvgEventRating(reviewData.avgEventRating || 0)
        } catch (_) {}

      } catch (err) {
        showToast("Experience not found", 'error')
      } finally { setLoading(false) }
    }
    fetchEventData()
  }, [id, isLoggedIn, user?.id])

  const handleBook = async () => {
    if (!isLoggedIn) {
      showToast('Login required for booking', 'error')
      navigate('/login', { state: { from: `/events/${id}` } })
      return
    }

    setBooking(true)
    try {
      const { data } = await api.post('/bookings', { eventId: id, quantity })
      showToast(`Success! Ticket ID: ${data.ticketId}`, 'success')
      setHasBooked(true)
      setEvent(prev => prev ? ({ ...prev, availableSeats: prev.availableSeats - quantity }) : null)
      setTimeout(() => navigate(`/bookings/${data.booking?._id}`), 2000)
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed', 'error')
    } finally { setBooking(false) }
  }

  if (loading) return (
    <div className="page-wrapper flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-paper-300 border-t-forest-700 rounded-full animate-spin"></div>
    </div>
  )

  if (!event) return <div className="page-wrapper flex items-center justify-center text-ink-900 font-serif italic text-2xl">Event Not Found</div>

  const isSoldOut = event.availableSeats <= 0
  const isOrganizer = user?.id === (event.organizerId?._id || event.organizerId)
  const organizer = event.organizerId

  return (
    <div className="page-wrapper pb-24">
      <main className="container-paper pt-12">
        <div className="mb-8 border-b-2 border-paper-300 pb-4">
          <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-widest text-ink-500 hover:text-forest-700 transition-all flex items-center gap-2">
            <span>←</span> Return to Browse
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start animate-fadeIn">

          <div className="space-y-8">
            <div className="relative overflow-hidden bg-paper-200 aspect-[16/9] border-2 border-paper-300 shadow-paper group">
              <img
                src={event.imageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop`}
                className="w-full h-full object-cover transition-transform duration-1000"
                alt={event.title}
                onError={handleImageError}
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-paper border-2 border-forest-700 text-[9px] font-black uppercase tracking-widest text-forest-700 shadow-sm">
                  Experience
                </span>
              </div>
              {/* Event rating overlay */}
              {avgEventRating > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-paper/90 backdrop-blur-sm px-3 py-1.5 border border-paper-300 shadow-sm">
                  <StarRating value={avgEventRating} readOnly size="sm" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-ink-500">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight leading-tight text-ink-900">{event.title}</h1>

              {/* Organizer badge */}
              {organizer?.name && (
                <div className="flex items-center gap-4 py-3 px-4 bg-paper-50 border-2 border-paper-300">
                  <div className="w-9 h-9 bg-forest-50 border-2 border-forest-700 flex items-center justify-center font-serif italic text-forest-800 font-bold">
                    {organizer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-ink-400 mb-0.5">Organised by</p>
                    <p className="font-bold text-ink-900 text-sm font-sans">{organizer.name}</p>
                  </div>
                  {organizer.avgRating > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-ink-400 mb-1">Organiser Rating</p>
                      <StarRating value={organizer.avgRating} readOnly size="sm" showCount count={organizer.reviewCount} />
                    </div>
                  )}
                  {organizer.avgRating === 0 && (
                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-ink-300 bg-paper-100 px-2 py-1 border border-paper-200">
                      No Reviews Yet
                    </span>
                  )}
                </div>
              )}

              <p className="text-xl text-ink-700 leading-relaxed font-sans first-letter:text-5xl first-letter:font-serif first-letter:italic first-letter:mr-1 first-letter:-mt-1 first-letter:float-left">
                {event.description || "Join us for an exclusive event offering unmatched networking and curation."}
              </p>
            </div>

            {/* ── REVIEWS SECTION ─────────────────────────────────────────── */}
            <div className="pt-8 border-t-2 border-paper-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif italic text-ink-900">Attendee Reviews</h2>
                {avgEventRating > 0 && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2">
                    <span className="text-2xl font-bold font-mono text-amber-600">{avgEventRating.toFixed(1)}</span>
                    <div>
                      <StarRating value={avgEventRating} readOnly size="md" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-ink-400 mt-1">{reviews.length} rating{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="py-12 text-center bg-paper-50 border-2 border-dashed border-paper-300">
                  <p className="text-[11px] font-black uppercase tracking-widest text-ink-400">No reviews yet — be the first to rate this event after attending!</p>
                </div>
              ) : (
                <div className="divide-y-0 space-y-0">
                  {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="paper-card p-8 space-y-8 border-2 border-forest-700/20">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-500">Status</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${isSoldOut ? 'bg-red-50 text-red-700 border-red-200' : 'bg-forest-50 text-forest-700 border-forest-200'}`}>
                    {isSoldOut ? 'Sold Out' : `${event.availableSeats} available`}
                  </span>
                </div>
                <div className="w-full h-2 bg-paper-200 overflow-hidden border border-paper-300">
                  <div
                    className="h-full bg-forest-600 transition-all duration-700"
                    style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t-2 border-paper-300 border-dashed">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500 font-black uppercase text-[10px] tracking-widest">Date</span>
                  <span className="font-serif italic font-bold text-ink-900">{formatDate(event.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500 font-black uppercase text-[10px] tracking-widest">Time</span>
                  <span className="font-sans font-bold text-forest-700">{formatTime(event.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500 font-black uppercase text-[10px] tracking-widest">Location</span>
                  <span className="font-sans font-medium text-ink-900 text-right truncate max-w-[180px]" title={event.location}>{event.location}</span>
                </div>
                {event.ticketPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-500 font-black uppercase text-[10px] tracking-widest">Ticket</span>
                    <span className="font-mono font-bold text-forest-700">₹{event.ticketPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {!hasBooked && !isOrganizer && !isSoldOut && (
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between p-2 bg-paper-50 border-2 border-paper-300">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-ink-500 hover:text-forest-700 transition-colors">-</button>
                    <span className="font-mono text-lg font-black text-ink-900">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(10, event.availableSeats, q + 1))} className="w-10 h-10 flex items-center justify-center font-bold text-ink-500 hover:text-forest-700 transition-colors">+</button>
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="btn-forest w-full py-4 text-xs shadow-paper"
                  >
                    {booking ? 'Processing...' : 'Secure Booking'}
                  </button>
                </div>
              )}

              {hasBooked && (
                <Link to="/bookings" className="block w-full py-4 bg-forest-50 border-2 border-forest-200 text-forest-700 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-forest-100 mt-4">
                  ✓ Ticket Secured
                </Link>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default EventDetail;