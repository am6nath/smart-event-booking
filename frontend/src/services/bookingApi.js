import api from './axios'

// ═══════════════════════════════════════════
// 🎫 BOOKING API CALLS
// ═══════════════════════════════════════════

const bookingApi = {
  // Book an event
  book: (data) =>
    api.post('/bookings', data),

  // Get user's own bookings
  getMyBookings: (params = {}) =>
    api.get('/bookings/my', { params }),

  // Get single booking
  getById: (id) =>
    api.get(`/bookings/${id}`),

  // Get all bookings for an event (organizer)
  getEventBookings: (eventId) =>
    api.get(`/bookings/event/${eventId}`),

  // Cancel booking
  cancel: (id) =>
    api.put(`/bookings/${id}/cancel`),
}

export default bookingApi