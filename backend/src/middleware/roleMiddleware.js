// Role-based access is handled via authorize() in authMiddleware.js
// This file is reserved for future granular permission logic

const { authorize } = require('./authMiddleware');

// Shortcut role guards for cleaner route definitions
exports.isAdmin = authorize('admin');
exports.isOrganizer = authorize('organizer', 'admin');
exports.isUser = authorize('user', 'organizer', 'admin');