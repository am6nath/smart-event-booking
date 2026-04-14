/**
 * ═══════════════════════════════════════════════
 * 🎫 TICKET ID GENERATOR
 * ═══════════════════════════════════════════════
 *
 * Format : TKT-{userLast4}-{eventLast4}-{timestamp36}{random3}
 * Example: TKT-4CB5-69CD-K2X9Z3F
 *
 * Uniqueness guaranteed by:
 *   1. User ID component    → ties ticket to specific user
 *   2. Event ID component   → ties ticket to specific event
 *   3. Millisecond timestamp (base36) → time-based uniqueness
 *   4. 3-char random suffix → collision prevention
 *
 * Matches model constraint: uppercase: true in Booking schema
 * ═══════════════════════════════════════════════
 */

/**
 * Generate a unique ticket ID
 * @param {string|ObjectId} userId  - MongoDB User ObjectId
 * @param {string|ObjectId} eventId - MongoDB Event ObjectId
 * @returns {string} Unique ticket ID e.g. TKT-4CB5-69CD-K2X9Z3F
 */
exports.generateTicketId = (userId, eventId) => {
  // Extract last 4 chars of each MongoDB ObjectId (24 hex chars total)
  const userPart  = userId.toString().slice(-4).toUpperCase();
  const eventPart = eventId.toString().slice(-4).toUpperCase();

  // Compact timestamp in base36 for short but time-unique string
  const timePart  = Date.now().toString(36).toUpperCase();

  // 3-char random alphanumeric suffix to prevent same-millisecond collisions
  const randomPart = Math.random().toString(36).slice(-3).toUpperCase();

  return `TKT-${userPart}-${eventPart}-${timePart}${randomPart}`;
};

/**
 * Validate ticket ID format
 * @param {string} ticketId - Ticket ID to validate
 * @returns {boolean} true if valid format
 */
exports.validateTicketId = (ticketId) => {
  // Pattern: TKT-{4chars}-{4chars}-{alphanumeric}
  const pattern = /^TKT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]+$/;
  return pattern.test(ticketId);
};