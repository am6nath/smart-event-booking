import { Link } from 'react-router-dom';
import { memo } from 'react';
import { formatDate, formatPrice, getSeatStatus, truncate, getCategoryClasses } from '../../utils/helpers';

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
)
const LocationIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)
const UsersIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)

const EventCard = memo(({ event }) => {
  const seatStatus = getSeatStatus(event.availableSeats, event.totalSeats)
  const catClass   = getCategoryClasses(event.category)
  const occupancy  = Math.round(((event.totalSeats - event.availableSeats) / event.totalSeats) * 100) || 0

  return (
    <Link
      to={`/events/${event._id}`}
      className="group glass-panel rounded-2xl overflow-hidden flex flex-col hover:border-white/20 hover:-translate-y-1.5 hover:shadow-[0_10px_40px_rgba(220,38,38,0.2)] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.imageUrl || `https://picsum.photos/seed/${event._id}/400/200`}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = `https://picsum.photos/seed/${event._id}/400/200` }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent"/>

        {/* Category badge */}
        <div className={`absolute bottom-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${catClass} backdrop-blur-sm capitalize border border-white/20 shadow-lg`}>
          {event.category}
        </div>

        {/* Price badge */}
        <div className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${
          event.ticketPrice === 0
            ? 'bg-green-500/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-dark-900/80 text-white border border-white/10'
        }`}>
          {formatPrice(event.ticketPrice)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 relative">
        <h3 className="font-bold text-base mb-3 group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
          {event.title}
        </h3>

        {/* Meta */}
        <div className="space-y-1.5 mb-4">
          {[
            { icon: <CalendarIcon/>, text: formatDate(event.date) },
            { icon: <LocationIcon/>, text: truncate(event.location, 35) },
            { icon: <UsersIcon/>,    text: `${event.availableSeats} seats left`, cls: seatStatus.color },
          ].map(({ icon, text, cls }, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs ${cls || 'text-gray-400 group-hover:text-gray-300 transition-colors'}`}>
              <span className="text-primary-500/70">{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Seat Progress */}
        <div className="mt-auto">
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2 relative">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${seatStatus.bar}`}
              style={{ width: `${Math.max(4, occupancy)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{occupancy}% booked</span>
            <span className={`font-semibold ${seatStatus.color}`}>{seatStatus.label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
});

EventCard.displayName = 'EventCard';
export default EventCard;