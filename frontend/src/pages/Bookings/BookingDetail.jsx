import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/bookings/${id}`);
        const bookingData = data.booking;
        setBooking(bookingData);
        
        if (bookingData.eventId?._id) {
          const { data: eventData } = await api.get(`/events/${bookingData.eventId._id}`);
          setEvent(eventData.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load booking');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    
    loadBooking();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully', { className: 'bg-forest-50 border-2 border-forest-200 !shadow-paper text-forest-900 font-sans font-bold text-xs' });
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking', { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' });
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-paper-300 border-t-forest-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking || !event) {
    return (
      <div className="page-wrapper flex items-center justify-center px-4">
        <div className="paper-card border-2 border-paper-300 p-12 text-center max-w-sm">
          <p className="text-ink-900 font-serif italic mb-6 text-xl">Booking not found</p>
          <Link to="/events" className="btn-outline-forest">
            ← Registry
          </Link>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const canCancel = !isPast && booking.status === 'confirmed';
  const totalPrice = event.ticketPrice * booking.quantity;

  return (
    <div className="page-wrapper py-16 px-6 lg:px-12 font-sans overflow-hidden">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Button - Hidden on Print */}
        <Link to="/bookings" className="mb-8 font-black uppercase text-[10px] tracking-[0.2em] text-ink-400 hover:text-forest-700 transition flex items-center gap-2 print:hidden">
          ← Back to My Bookings
        </Link>

        {/* Paper Ticket Card - Print Optimized */}
        <div className="bg-paper border-2 border-forest-700/60 shadow-[8px_8px_0_0_#2D5A27] relative overflow-hidden print:shadow-none print:border-ink-900">
           {/* Stamp Decoration */}
           <div className="absolute top-4 right-4 w-16 h-16 border-2 border-red-600/30 rounded-full flex items-center justify-center -rotate-12 select-none print:hidden">
              <span className="text-red-600/30 text-[10px] font-black uppercase tracking-widest text-center leading-tight">Authentic<br/>Record</span>
           </div>

          {/* Header */}
          <div className="h-48 border-b-2 border-forest-700/60 relative overflow-hidden print:h-32 print:border-ink-900 bg-paper-200">
            <img src={event.imageUrl || '/assets/event-placeholder.jpg'} alt={event.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute top-0 left-0 bg-paper border-b-2 border-r-2 border-forest-700/60 text-forest-800 px-4 py-2 text-[9px] font-black uppercase tracking-[0.3em] print:border-ink-900">
              {event.category}
            </div>
          </div>

          {/* Body: Event & Booking Info */}
          <div className="p-8 space-y-6 print:p-6 bg-paper-50 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
            {/* Event Title */}
            <div className="border-b-2 border-dashed border-paper-300 pb-6 text-center print:border-ink-200">
              <h1 className="text-3xl font-serif italic font-bold text-ink-900 mb-4 print:text-xl">{event.title}</h1>
              <div className="flex flex-wrap justify-center gap-6 text-[10px] text-ink-600 uppercase tracking-[0.2em] font-black">
                <span>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-paper-300">|</span>
                <span>{event.location}</span>
              </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-3 gap-6 text-center print:gap-4 border-b-2 border-dashed border-paper-300 pb-6 print:border-ink-200">
              <div>
                <p className="text-[9px] text-ink-400 font-black uppercase tracking-[0.3em] mb-2">Admissions</p>
                <p className="text-2xl font-serif italic text-ink-900 print:text-lg">{booking.quantity}x</p>
              </div>
              <div>
                <p className="text-[9px] text-ink-400 font-black uppercase tracking-[0.3em] mb-2">Total</p>
                <p className="text-2xl font-serif italic text-forest-700 font-bold print:text-lg">{event.ticketPrice === 0 ? 'COMP' : `₹${totalPrice.toLocaleString()}`}</p>
              </div>
              <div>
                <p className="text-[9px] text-ink-400 font-black uppercase tracking-[0.3em] mb-2">State</p>
                <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border-2 ${booking.status === 'confirmed' ? 'border-forest-700 text-forest-800 bg-forest-50' : 'border-red-600 text-red-700 bg-red-50'}`}>
                  {booking.status}
                </span>
              </div>
            </div>

            {/* Ticket ID */}
            <div className="text-center pt-2">
              <p className="text-[9px] text-ink-400 font-black uppercase tracking-[0.3em] mb-2">Identifier</p>
              <p className="font-mono text-2xl text-ink-900 font-bold tracking-tight break-all border-b-2 border-ink-900 inline-block px-2 print:text-base print:border-none">{booking.ticketId}</p>
              <p className="text-[9px] text-ink-500 uppercase tracking-widest mt-4 font-bold print:hidden">Non-transferable authentic token</p>
            </div>
          </div>

          {/* Actions - Print Optimized */}
           <div className="bg-paper border-t-2 border-forest-700/60 p-6 print:p-4 print:border-ink-900">
            <div className="flex flex-col items-center gap-5">
              
              <div className="flex flex-wrap justify-center gap-4 print:hidden">
                <button onClick={handlePrint} className="btn-forest !px-6 !py-2.5">
                  Engrave (Print)
                </button>
                {canCancel && (
                  <button onClick={handleCancel} className="btn-outline-forest !px-6 !py-2.5 !border-red-600 !text-red-600 hover:!bg-red-50">
                    Revoke token
                  </button>
                )}
                <Link to={`/events/${event._id}`} className="bg-paper border-2 border-ink-900 text-ink-900 uppercase tracking-widest text-[9px] font-black px-6 py-2.5 hover:bg-ink-50 transition-colors hidden sm:block">
                  View Entry
                </Link>
              </div>
              
              <div className="hidden print:block text-center text-[9px] text-ink-600 font-black uppercase tracking-[0.2em]">
                EventHub Archive • {new Date().getFullYear()} • Non-transferable Token
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;