/**
 * ═══════════════════════════════════════════════
 * 🔄 ASYNC WRAPPER UTILITY
 * ═══════════════════════════════════════════════
 *
 * Eliminates repetitive try/catch blocks in every
 * controller by wrapping async route handlers.
 *
 * Usage:
 *   Instead of:
 *     exports.getEvents = async (req, res) => {
 *       try { ... } catch(err) { next(err) }
 *     }
 *
 *   Use:
 *     exports.getEvents = asyncWrapper(async (req, res) => {
 *       ... no try/catch needed
 *     });
 *
 * ═══════════════════════════════════════════════
 */

/**
 * Wraps async route handlers to automatically
 * catch errors and forward to Express error middleware
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncWrapper;