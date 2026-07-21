const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/logger');

/**
 * Get Admin Dashboard Metrics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [electionsCount] = await db.query('SELECT COUNT(*) AS count FROM elections');
    const [nominationsCount] = await db.query('SELECT COUNT(*) AS count FROM candidate_nominations');
    const [pendingCount] = await db.query("SELECT COUNT(*) AS count FROM candidate_nominations WHERE status = 'pending'");
    const [approvedCount] = await db.query("SELECT COUNT(*) AS count FROM candidate_nominations WHERE status = 'approved'");
    const [organizersCount] = await db.query('SELECT COUNT(*) AS count FROM organizers');
    const [votersCount] = await db.query('SELECT COUNT(*) AS count FROM voters');
    const [votesCount] = await db.query('SELECT COUNT(*) AS count FROM votes');

    // Recent Activities (latest 8 logs)
    const [recentLogs] = await db.query(
      `SELECT al.*, 
       COALESCE(v.voter_id, o.username, a.username, 'System') AS user_name
       FROM activity_logs al
       LEFT JOIN voters v ON al.user_id = v.id AND al.user_role = 'voter'
       LEFT JOIN organizers o ON al.user_id = o.id AND al.user_role = 'organizer'
       LEFT JOIN admin a ON al.user_id = a.id AND al.user_role = 'admin'
       ORDER BY al.created_at DESC LIMIT 8`
    );

    return res.json({
      stats: {
        totalElections: electionsCount[0].count,
        totalNominations: nominationsCount[0].count,
        pendingNominations: pendingCount[0].count,
        approvedCandidates: approvedCount[0].count,
        totalOrganizers: organizersCount[0].count,
        totalVoters: votersCount[0].count,
        votesCast: votesCount[0].count
      },
      recentLogs
    });
  } catch (error) {
    console.error("Dashboard Error:");
    console.error(error);
    console.error(error.sqlMessage);
    console.error(error.sql);

    return res.status(500).json({
        message: error.sqlMessage
    });
}
};

/**
 * Fetch Analytics Chart Data
 */
const getChartData = async (req, res) => {
  try {
    // 1. Votes per Election
    const [votesPerElection] = await db.query(
      `SELECT e.title, COUNT(v.id) AS votes_count 
       FROM elections e 
       LEFT JOIN votes v ON e.id = v.election_id 
       GROUP BY e.id`
    );

    // 2. Candidate Distribution (Nominations by Position)
    const [candidateDistribution] = await db.query(
      `SELECT position, COUNT(*) AS count 
       FROM candidate_nominations 
       WHERE status = 'approved' 
       GROUP BY position`
    );

    // 3. Daily Registrations (last 14 days)
    const [dailyRegistrations] = await db.query(
      `SELECT DATE(created_at) AS reg_date, COUNT(*) AS count 
       FROM voters 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
       GROUP BY DATE(created_at) 
       ORDER BY reg_date ASC`
    );

    return res.json({
      votesPerElection,
      candidateDistribution,
      dailyRegistrations
    });
  } catch (error) {
    console.error('Fetch charts error:', error);
    return res.status(500).json({ message: 'Server error retrieving chart data.' });
  }
};

/**
 * Create a new Organizer (Admin only)
 */
const createOrganizer = async (req, res) => {
  const { username, uniqueNumber, password } = req.body;
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    // Check constraints
    const [existing] = await db.query(
      'SELECT id FROM organizers WHERE username = ? OR unique_number = ?',
      [username, uniqueNumber]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username or Unique Number is already allocated to another organizer.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO organizers (username, unique_number, password_hash) VALUES (?, ?, ?)',
      [username, uniqueNumber, passwordHash]
    );

    await logActivity({
      userId: adminId,
      userRole: 'admin',
      action: 'CREATE_ORGANIZER',
      details: `Created organizer: ${username} (Unique #: ${uniqueNumber})`,
      ipAddress: ip
    });

    return res.status(201).json({
      message: 'Organizer account successfully created!',
      organizer: {
        id: result.insertId,
        username,
        uniqueNumber
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    return res.status(500).json({ message: 'Server error while creating organizer account.' });
  }
};

/**
 * Reset Organizer Password
 */
const resetOrganizerPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const [organizerRows] = await db.query('SELECT username FROM organizers WHERE id = ?', [id]);
    if (organizerRows.length === 0) {
      return res.status(404).json({ message: 'Organizer account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE organizers SET password_hash = ? WHERE id = ?', [newPasswordHash, id]);

    await logActivity({
      userId: adminId,
      userRole: 'admin',
      action: 'RESET_ORGANIZER_PASSWORD',
      details: `Reset password for organizer: ${organizerRows[0].username}`,
      ipAddress: ip
    });

    return res.json({ message: `Successfully reset password for organizer: ${organizerRows[0].username}` });
  } catch (error) {
    console.error('Organizer password reset error:', error);
    return res.status(500).json({ message: 'Server error resetting organizer password.' });
  }
};

/**
 * Toggle Organizer Status (Active/Disabled)
 */
const toggleOrganizerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'disabled'
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "active" or "disabled".' });
  }

  try {
    const [organizerRows] = await db.query('SELECT username FROM organizers WHERE id = ?', [id]);
    if (organizerRows.length === 0) {
      return res.status(404).json({ message: 'Organizer account not found.' });
    }

    await db.query('UPDATE organizers SET status = ? WHERE id = ?', [status, id]);

    await logActivity({
      userId: adminId,
      userRole: 'admin',
      action: `TOGGLE_ORGANIZER_STATUS_${status.toUpperCase()}`,
      details: `Changed organizer status to ${status} for user: ${organizerRows[0].username}`,
      ipAddress: ip
    });

    return res.json({ message: `Organizer ${organizerRows[0].username} is now ${status}.` });
  } catch (error) {
    console.error('Toggle organizer error:', error);
    return res.status(500).json({ message: 'Server error updating organizer status.' });
  }
};

/**
 * Delete Organizer account
 */
const deleteOrganizer = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const [organizerRows] = await db.query('SELECT username FROM organizers WHERE id = ?', [id]);
    if (organizerRows.length === 0) {
      return res.status(404).json({ message: 'Organizer account not found.' });
    }

    await db.query('DELETE FROM organizers WHERE id = ?', [id]);

    await logActivity({
      userId: adminId,
      userRole: 'admin',
      action: 'DELETE_ORGANIZER',
      details: `Deleted organizer: ${organizerRows[0].username}`,
      ipAddress: ip
    });

    return res.json({ message: `Successfully deleted organizer account: ${organizerRows[0].username}` });
  } catch (error) {
    console.error('Delete organizer error:', error);
    return res.status(500).json({ message: 'Server error deleting organizer.' });
  }
};

/**
 * List all Organizers with search and pagination
 */
const getOrganizers = async (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT id, username, unique_number, status, created_at FROM organizers';
    let countQuery = 'SELECT COUNT(*) AS count FROM organizers';
    let queryParams = [];

    if (search) {
      query += ' WHERE username LIKE ? OR unique_number LIKE ?';
      countQuery += ' WHERE username LIKE ? OR unique_number LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.query(query, queryParams);
    const [totalRows] = await db.query(countQuery, search ? [`%${search}%`, `%${search}%`] : []);

    return res.json({
      organizers: rows,
      totalPages: Math.ceil(totalRows[0].count / limit),
      currentPage: page,
      totalCount: totalRows[0].count
    });
  } catch (error) {
    console.error('Fetch organizers error:', error);
    return res.status(500).json({ message: 'Server error retrieving organizers list.' });
  }
};

/**
 * Manage Voter Accounts (List, Search, Toggle status)
 */
const getVoters = async (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '15', 10);
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT id, voter_id, status, created_at FROM voters';
    let countQuery = 'SELECT COUNT(*) AS count FROM voters';
    let queryParams = [];

    if (search) {
      query += ' WHERE voter_id LIKE ?';
      countQuery += ' WHERE voter_id LIKE ?';
      queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.query(query, queryParams);
    const [totalRows] = await db.query(
        countQuery,
        search ? [`%${search}%`] : []
    );

    return res.json({
      voters: rows,
      totalPages: Math.ceil(totalRows[0].count / limit),
      currentPage: page,
      totalCount: totalRows[0].count
    });
  } catch (error) {
    console.error('Fetch voters error:', error);
    return res.status(500).json({ message: 'Server error retrieving voters list.' });
  }
};
const createVoter = async (req, res) => {

  console.log("========== CREATE VOTER ==========");
  console.log("Request Body:", req.body);

  const { voter_id, password } = req.body;

  console.log("voter_id =", voter_id);
  console.log("password =", password);

  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {

    // Check whether Voter ID already exists
    const [existing] = await db.query(
      "SELECT id FROM voters WHERE voter_id = ?",
      [voter_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Voter ID already exists"
      });
    }

    // Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert voter
    const [result] = await db.query(
      `INSERT INTO voters
      (voter_id, password_hash, status)
      VALUES (?, ?, ?)`,
      [voter_id, passwordHash, "active"]
    );

    // Save activity log
    await logActivity({
      userId: adminId,
      userRole: "admin",
      action: "CREATE_VOTER",
      details: `Created voter ${voter_id}`,
      ipAddress: ip
    });

    return res.status(201).json({
      message: "Voter created successfully",
      voterId: result.insertId
    });

  } catch (error) {

    console.error("Create voter error:", error);

    return res.status(500).json({
      message: error.message
    });

  }

};
const deleteVoter = async (req, res) => {

  const { id } = req.params;

  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {

    // Check whether voter exists
    const [rows] = await db.query(
        "SELECT voter_id FROM voters WHERE id = ?",
        [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Voter not found"
      });
    }

    // Delete voter
    await db.query(
      "DELETE FROM voters WHERE id = ?",
      [id]
    );

    // Log activity
    await logActivity({
      userId: adminId,
      userRole: "admin",
      action: "DELETE_VOTER",
      details: `Deleted voter ${rows[0].voter_id}`,
      ipAddress: ip
    });

    return res.json({
      message: "Voter deleted successfully"
    });

  } catch (error) {

    console.error("Delete voter error:", error);

    return res.status(500).json({
      message: "Server error while deleting voter."
    });

  }

};
const toggleVoterStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const [voterRows] = await db.query(
        'SELECT voter_id FROM voters WHERE id = ?',
        [id]
    );
    if (voterRows.length === 0) {
      return res.status(404).json({ message: 'Voter account not found.' });
    }

    await db.query('UPDATE voters SET status = ? WHERE id = ?', [status, id]);

    await logActivity({
      userId: adminId,
      userRole: 'admin',
      action: `TOGGLE_VOTER_${status.toUpperCase()}`,
      details: `Voter status changed to ${status} for: ${voterRows[0].voter_id}`,
      ipAddress: ip
    });

    return res.json({ message: `Voter account status updated to ${status}.` });
  } catch (error) {
    console.error('Toggle voter error:', error);
    return res.status(500).json({ message: 'Server error updating voter account.' });
  }
};

/**
 * Handle Candidate Nominations (List, Detail, Approve, Reject)
 */
const getNominations = async (req, res) => {
  const status = req.query.status || 'all'; // all, pending, approved, rejected
  const search = req.query.search || '';
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM candidate_nominations';
    let countQuery = 'SELECT COUNT(*) AS count FROM candidate_nominations';
    let queryParams = [];
    let conditions = [];

    if (status !== 'all') {
      conditions.push('status = ?');
      queryParams.push(status);
    }

    if (search) {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR position LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    // Duplicate condition params for count query before modifying params array
    const countParams = [...queryParams];
    
    queryParams.push(limit, offset);

    const [rows] = await db.query(query, queryParams);
    const [totalRows] = await db.query(countQuery, countParams);

    return res.json({
      nominations: rows,
      totalPages: Math.ceil(totalRows[0].count / limit),
      currentPage: page,
      totalCount: totalRows[0].count
    });
  } catch (error) {
    console.error('Fetch nominations error:', error);
    return res.status(500).json({ message: 'Server error retrieving candidate nominations.' });
  }
};

const getNominationDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM candidate_nominations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nomination record not found.' });
    }
    return res.json({ nomination: rows[0] });
  } catch (error) {
    console.error('Fetch nomination details error:', error);
    return res.status(500).json({ message: 'Server error retrieving nomination profile.' });
  }
};

const updateNominationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "approved" or "rejected".' });
  }

  try {
    const [rows] = await db.query('SELECT full_name, email, position FROM candidate_nominations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nomination record not found.' });
    }

    const nomination = rows[0];

    // Update nomination status
    await db.query('UPDATE candidate_nominations SET status = ? WHERE id = ?', [status, id]);

    // Send status notification email
    const subject = `Candidate Nomination ${status.toUpperCase()} - Online Election Management System`;
    const message = status === 'approved' 
      ? `Dear ${nomination.full_name},\n\nCongratulations! Your candidate nomination for the position of "${nomination.position}" has been APPROVED by the Administrator.\n\nOrganizers can now select you to participate in active elections. Keep track of the election schedules.\n\nBest Regards,\nElection Administrator`
      : `Dear ${nomination.full_name},\n\nWe regret to inform you that your candidate nomination for the position of "${nomination.position}" has been REJECTED by the Administrator.\n\nPlease contact support or resubmit with valid details if required.\n\nBest Regards,\nElection Administrator`;

    await logActivity({
      userId: adminId,
      userRole: 'admin',
      action: `NOMINATION_${status.toUpperCase()}`,
      details: `Nomination id ${id} for candidate ${nomination.full_name} (${nomination.position}) is now ${status}`,
      ipAddress: ip
    });

    // Send Email
    // Don't await on email block to respond faster to client
    db.query(
      `INSERT INTO notifications (user_id, user_role, message) 
       VALUES ((SELECT id FROM voters WHERE email = ? LIMIT 1), 'voter', ?)`,
      [nomination.email, `Your candidate nomination for "${nomination.position}" has been ${status}.`]
    ).catch(e => console.error('Notify log failed', e));

    // Send external notification email
    require('../utils/email').sendEmail({
      to: nomination.email,
      subject,
      text: message
    });

    return res.json({ message: `Candidate nomination is successfully updated to ${status}.` });
  } catch (error) {
    console.error('Update nomination status error:', error);
    return res.status(500).json({ message: 'Server error updating nomination status.' });
  }
};
/**
 * Delete Candidate Nomination
 */
const deleteNomination = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    // Check if nomination exists
    const [rows] = await db.query(
      "SELECT full_name FROM candidate_nominations WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Nomination not found."
      });
    }

    // Delete nomination
    await db.query(
      "DELETE FROM candidate_nominations WHERE id = ?",
      [id]
    );

    // Log activity
    await logActivity({
      userId: adminId,
      userRole: "admin",
      action: "DELETE_NOMINATION",
      details: `Deleted nomination of ${rows[0].full_name}`,
      ipAddress: ip
    });

    return res.json({
      message: "Nomination deleted successfully."
    });

  } catch (error) {
    console.error("Delete nomination error:", error);

    return res.status(500).json({
      message: "Server error deleting nomination."
    });
  }
};
/**
 * Fetch System Audit Logs
 */
const getAuditLogs = async (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const page = parseInt(req.query.page || '1', 10);
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query(
      `SELECT al.*, 
       COALESCE(v.voter_id, o.username, a.username, 'System') AS user_name
       FROM activity_logs al
       LEFT JOIN voters v ON al.user_id = v.id AND al.user_role = 'voter'
       LEFT JOIN organizers o ON al.user_id = o.id AND al.user_role = 'organizer'
       LEFT JOIN admin a ON al.user_id = a.id AND al.user_role = 'admin'
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows] = await db.query('SELECT COUNT(*) AS count FROM activity_logs');

    return res.json({
      logs: rows,
      totalPages: Math.ceil(totalRows[0].count / limit),
      currentPage: page,
      totalCount: totalRows[0].count
    });
  } catch (error) {
    console.error('Fetch logs error:', error);
    return res.status(500).json({ message: 'Server error retrieving audit logs.' });
  }
};

/**
 * Export CSV Report Data
 */
const exportReport = async (req, res) => {
  const { type } = req.query; // 'audit', 'voters', 'results'

  try {
    let data = [];
    let csvHeaders = '';

    if (type === 'audit') {
      const [rows] = await db.query(`
        SELECT al.id, al.created_at, al.user_role, al.action, al.details, al.ip_address,
        COALESCE(v.voter_id, o.username, a.username, 'System') AS user_name
        FROM activity_logs al
        LEFT JOIN voters v ON al.user_id = v.id AND al.user_role = 'voter'
        LEFT JOIN organizers o ON al.user_id = o.id AND al.user_role = 'organizer'
        LEFT JOIN admin a ON al.user_id = a.id AND al.user_role = 'admin'
        ORDER BY al.created_at DESC
      `);
      csvHeaders = 'Log ID,Timestamp,Role,Actor,Action,Details,IP Address\n';
      data = rows.map(r => 
        `"${r.id}","${r.created_at}","${r.user_role}","${r.user_name}","${r.action}","${(r.details || '').replace(/"/g, '""')}","${r.ip_address || ''}"`
      );
    } else if (type === 'voters') {
      const [rows] = await db.query(
          `SELECT id, voter_id, status, created_at
           FROM voters
           ORDER BY voter_id ASC`
      );

      csvHeaders =
      'ID,Voter ID,Status,Created At\n';

      data = rows.map(r =>
       `"${r.id}","${r.voter_id}","${r.status}","${r.created_at}"`
      );
    } else if (type === 'results') {
      const [rows] = await db.query(`
        SELECT e.title AS election_title, e.position, cn.full_name AS candidate_name, COUNT(v.id) AS vote_count
        FROM elections e
        JOIN election_candidates ec ON e.id = ec.election_id
        JOIN candidate_nominations cn ON ec.candidate_nomination_id = cn.id
        LEFT JOIN votes v ON e.id = v.election_id AND cn.id = v.candidate_nomination_id
        GROUP BY e.id, cn.id
        ORDER BY e.title, vote_count DESC
      `);
      csvHeaders = 'Election Title,Position,Candidate Name,Votes Received\n';
      data = rows.map(r => 
        `"${r.election_title}","${r.position}","${r.candidate_name}","${r.vote_count}"`
      );
    } else {
      return res.status(400).json({ message: 'Invalid export report type.' });
    }

    const csvContent = csvHeaders + data.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV report error:', error);
    return res.status(500).json({ message: 'Server error generating export report.' });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { username, email, currentPassword, newPassword } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM admin WHERE id = ?",
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];

    const validPassword = await bcrypt.compare(
      currentPassword,
      admin.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    let passwordHash = admin.password_hash;

    if (newPassword && newPassword.trim() !== "") {
      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await db.query(
      `UPDATE admin
       SET username = ?, email = ?, password_hash = ?
       WHERE id = ?`,
      [username, email, passwordHash, adminId]
    );

    res.json({
      message: "Profile updated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error"
    });
  }
};
module.exports = {
  getDashboardStats,
  getChartData,

  createOrganizer,
  resetOrganizerPassword,
  toggleOrganizerStatus,
  deleteOrganizer,
  getOrganizers,

  getVoters,
  createVoter,
  deleteVoter,
  toggleVoterStatus,

  getNominations,
  getNominationDetail,
  updateNominationStatus,
  deleteNomination,

  getAuditLogs,
  exportReport,
  updateAdminProfile
};