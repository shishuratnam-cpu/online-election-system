const db = require('../config/db');

/**
 * Log activity to the database activity_logs table.
 * 
 * @param {Object} params Log details
 * @param {number|null} params.userId User database ID (optional)
 * @param {string} params.userRole Role of the user: 'admin', 'organizer', 'voter', 'candidate', 'system'
 * @param {string} params.action Activity tag (e.g. 'USER_LOGIN', 'CREATE_ELECTION')
 * @param {string} params.details Detailed description of activity
 * @param {string|null} params.ipAddress Client IP address (optional)
 */
const logActivity = async ({ userId = null, userRole = 'system', action, details, ipAddress = null }) => {
  try {
    const query = `
      INSERT INTO activity_logs (user_id, user_role, action, details, ip_address) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(query, [userId, userRole, action, details, ipAddress]);
  } catch (error) {
    console.error('Failed to write activity log to database:', error.message);
  }
};

/**
 * Middleware wrapper to easily log requests/actions
 */
const logRequest = (action, detailsBuilder) => {
  return async (req, res, next) => {
    // Save a copy of send to capture completion status
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;
      originalSend.apply(this, arguments);

      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : 'system';
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const details = typeof detailsBuilder === 'function' ? detailsBuilder(req, res, body) : detailsBuilder;

      // Log in background
      logActivity({
        userId,
        userRole,
        action,
        details,
        ipAddress: ip
      });
    };
    next();
  };
};

module.exports = {
  logActivity,
  logRequest
};
