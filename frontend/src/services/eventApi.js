import api from './axios'

// ═══════════════════════════════════════════
// 🎪 EVENT API CALLS
// ═══════════════════════════════════════════

const eventApi = {
  // 📋 Get all approved events (with filters)
  getAll: (params = {}) =>
    api.get('/events', { params }),

  // 🔍 Get single event by ID
  getOne: (id) =>
    api.get(`/events/${id}`),

  // 🗓️ Get organizer's own events
  getMyEvents: (params = {}) =>
    api.get('/events/organizer/my', { params }),

  // 📊 Get event statistics
  getStats: (id) =>
    api.get(`/events/${id}/stats`),

  // ➕ Create new event (organizer)
  create: (data) =>
    api.post('/events', data),

  // ✏️ Update event
  update: (id, data) =>
    api.put(`/events/${id}`, data),

  // 🗑️ Delete event
  delete: (id) =>
    api.delete(`/events/${id}`),
}

export default eventApi