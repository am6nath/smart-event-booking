import api from './axios'

// ═══════════════════════════════════════════
// 👑 ADMIN API CALLS
// ═══════════════════════════════════════════

const adminApi = {
  // Dashboard
  getDashboard: () =>
    api.get('/admin/dashboard'),

  // Users
  getAllUsers:    (params = {}) => api.get('/admin/users', { params }),
  updateUserRole: (id, role)   => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser:     (id)         => api.delete(`/admin/users/${id}`),

  // Events
  getAllEvents:  (params = {}) => api.get('/admin/events', { params }),
  approveEvent: (id, data)    => api.put(`/admin/events/${id}/approve`, data),
  deleteEvent:  (id)          => api.delete(`/admin/events/${id}`),

  // Bookings
  getAllBookings: (params = {}) => api.get('/admin/bookings', { params }),
}

export default adminApi