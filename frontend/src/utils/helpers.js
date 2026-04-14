// ═══════════════════════════════════════════
// 📅 Format date → "Dec 15, 2025"
// ═══════════════════════════════════════════
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

// ═══════════════════════════════════════════
// 🕐 Format time → "10:00 AM"
// ═══════════════════════════════════════════
export const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  })

// ═══════════════════════════════════════════
// 💰 Format price → "₹1,499" or "FREE"
// ═══════════════════════════════════════════
export const formatPrice = (price) => {
  if (!price || price === 0) return 'FREE'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

// ═══════════════════════════════════════════
// ✂️ Truncate text
// ═══════════════════════════════════════════
export const truncate = (text, length = 100) => {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

// ═══════════════════════════════════════════
// 🎟 Get seat availability status
// ═══════════════════════════════════════════
export const getSeatStatus = (available, total) => {
  if (!total) return { label: 'Closed', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
  const pct = (available / total) * 100
  if (pct === 0)        return { label: 'Sold Out', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
  if (pct <= 20)        return { label: 'Few Left', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  return                       { label: 'Available', color: 'text-forest-700', bg: 'bg-forest-100', border: 'border-forest-300' }
}

// ═══════════════════════════════════════════
// 🎨 Get status badge classes
// ═══════════════════════════════════════════
export const getStatusBadge = (status) => {
  const map = {
    draft:     'bg-paper-200 text-ink-700 border border-paper-300',
    pending:   'bg-amber-50 text-amber-700 border border-amber-200',
    approved:  'bg-forest-50 text-forest-700 border border-forest-200',
    rejected:  'bg-red-50 text-red-700 border border-red-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
    completed: 'bg-forest-900 text-paper border border-forest-950',
    confirmed: 'bg-forest-50 text-forest-700 border border-forest-200',
  }
  return map[status] || map.pending
}

// ═══════════════════════════════════════════
// 🏷️ Get category color classes
// ═══════════════════════════════════════════
export const getCategoryClasses = (category) => {
  const map = {
    conference:  'bg-forest-100 text-forest-800 border-forest-300',
    workshop:    'bg-amber-50 text-amber-800 border-amber-200',
    concert:     'bg-ink-100 text-ink-800 border-ink-300',
    sports:      'bg-forest-50 text-forest-700 border-forest-200',
    networking:  'bg-paper-200 text-ink-900 border-paper-300',
    webinar:     'bg-blue-50 text-blue-800 border-blue-200',
    festival:    'bg-red-50 text-red-800 border-red-200',
    other:       'bg-paper-100 text-ink-600 border-paper-200',
  }
  return map[category] || map.other
}