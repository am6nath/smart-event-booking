import api from './axios'

// ═══════════════════════════════════════════
// 🔐 AUTH API CALLS
// ═══════════════════════════════════════════

const authApi = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getProfile:     ()     => api.get('/auth/profile'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export default authApi