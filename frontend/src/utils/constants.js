// ═══════════════════════════════════════════
// 🔧 APP CONSTANTS
// ═══════════════════════════════════════════

export const API = {
  BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
}

export const ROLES = {
  USER:      'user',
  ORGANIZER: 'organizer',
  ADMIN:     'admin',
}

export const EVENT_STATUS = {
  DRAFT:     'draft',
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
}

export const CATEGORIES = [
  'conference',
  'workshop',
  'concert',
  'sports',
  'networking',
  'webinar',
  'festival',
  'other',
]

export const CATEGORY_ICONS = {
  conference:  '🎤',
  workshop:    '🛠️',
  concert:     '🎵',
  sports:      '⚽',
  networking:  '🤝',
  webinar:     '💻',
  festival:    '🎪',
  other:       '📌',
}