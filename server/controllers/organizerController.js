const db = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * Fetch Organizer Dashboard stats
 */
const getOrganizerDashboard = async (req, res) => {
  const organizerId = req.user.id;

  try {
    // Total Elections by this Organizer
    const [totalRows] = await db.query('SELECT COUNT(*) AS count FROM elections WHERE organizer_id = ?', [organizerId]);
    
    // Running Elections (current time is between start and end date/time)
    const [runningRows] = await db.query(
      `SELECT COUNT(*) AS count FROM elections 
       WHERE organizer_id = ? AND status = 'published'
       AND CONCAT(start_date, ' ', voting_start_time) <= NOW()
       AND CONCAT(end_date, ' ', voting_end_time) >= NOW()`,
      [organizerId]
    );

    // Upcoming Elections
    const [upcomingRows] = await db.query(
      `SELECT COUNT(*) AS count FROM elections 
       WHERE organizer_id = ? AND status = 'published'
       AND CONCAT(start_date, ' ', voting_start_time) > NOW()`,
      [organizerId]
    );

    // Completed Elections
    const [completedRows] = await db.query(
      `SELECT COUNT(*) AS count FROM elections 
       WHERE organizer_id = ? AND (status = 'ended' OR CONCAT(end_date, ' ', voting_end_time) < NOW())`,
      [organizerId]
    );

    // List of organizer's elections
    const [elections] = await db.query(
      `SELECT e.*,
       (SELECT COUNT(*) FROM election_candidates WHERE election_id = e.id) AS candidates_count,
       (SELECT COUNT(*) FROM votes WHERE election_id = e.id) AS votes_count
       FROM elections e 
       WHERE e.organizer_id = ? 
       ORDER BY e.created_at DESC`,
      [organizerId]
    );

    return res.json({
      stats: {
        myElections: totalRows[0].count,
        runningElections: runningRows[0].count,
        upcomingElections: upcomingRows[0].count,
        completedElections: completedRows[0].count
      },
      elections
    });
  } catch (error) {
    console.error('Fetch organizer dashboard error:', error);
    return res.status(500).json({ message: 'Server error retrieving organizer statistics.' });
  }
};

/**
 * Fetch Approved Candidates (For picking candidates to participate in elections)
 */
const getApprovedCandidates = async (req, res) => {
  const { position } = req.query; // Filter by applying position if requested

  try {
    let query = "SELECT id, full_name, email, position, college_org, photo_path FROM candidate_nominations WHERE status = 'approved'";
    let params = [];

    if (position) {
      query += ' AND position = ?';
      params.push(position);
    }

    const [rows] = await db.query(query, params);
    return res.json({ candidates: rows });
  } catch (error) {
    console.error('Fetch approved candidates error:', error);
    return res.status(500).json({ message: 'Server error retrieving approved candidates.' });
  }
};

/**
 * Create an Election (Organizer only)
 */
const createElection = async (req, res) => {
  const { title, description, position, startDate, endDate, votingStartTime, votingEndTime, candidateIds } = req.body;
  const organizerId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insert Election Profile
      const [electionResult] = await connection.query(
        `INSERT INTO elections (title, description, position, start_date, end_date, voting_start_time, voting_end_time, organizer_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [title, description, position, startDate, endDate, votingStartTime, votingEndTime, organizerId]
      );

      const electionId = electionResult.insertId;

      // 2. Associate Approved Candidates (junction table mapping)
      if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
        const candidateValues = candidateIds.map(candId => [electionId, candId]);
        await connection.query(
          'INSERT INTO election_candidates (election_id, candidate_nomination_id) VALUES ?',
          [candidateValues]
        );
      }

      await connection.commit();
      connection.release();

      await logActivity({
        userId: organizerId,
        userRole: 'organizer',
        action: 'CREATE_ELECTION',
        details: `Created election: "${title}" (ID: ${electionId}) for position: "${position}"`,
        ipAddress: ip
      });

      return res.status(201).json({
        message: 'Election created successfully in draft mode!',
        electionId
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Create election error:', error);
    return res.status(500).json({ message: 'Server error during election creation.' });
  }
};

/**
 * Get Specific Election Details (for edit/view)
 */
const getElectionDetail = async (req, res) => {
  const { id } = req.params;
  const organizerId = req.user.id;

  try {
    const [electionRows] = await db.query(
      'SELECT * FROM elections WHERE id = ? AND organizer_id = ?',
      [id, organizerId]
    );

    if (electionRows.length === 0) {
      return res.status(404).json({ message: 'Election not found or unauthorized.' });
    }

    const election = electionRows[0];

    // Fetch Associated Candidates details
    const [candidateRows] = await db.query(
      `SELECT cn.id, cn.full_name, cn.email, cn.position, cn.college_org, cn.photo_path, cn.manifesto_path
       FROM candidate_nominations cn
       JOIN election_candidates ec ON cn.id = ec.candidate_nomination_id
       WHERE ec.election_id = ?`,
      [id]
    );

    return res.json({
      election,
      candidates: candidateRows
    });
  } catch (error) {
    console.error('Fetch election details error:', error);
    return res.status(500).json({ message: 'Server error retrieving election information.' });
  }
};

/**
 * Update/Edit Election Details (Organizer only)
 */
const updateElection = async (req, res) => {
  const { id } = req.params;
  const { title, description, position, startDate, endDate, votingStartTime, votingEndTime, candidateIds, status } = req.body;
  const organizerId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const [electionRows] = await db.query('SELECT status FROM elections WHERE id = ? AND organizer_id = ?', [id, organizerId]);
    if (electionRows.length === 0) {
      return res.status(404).json({ message: 'Election record not found or unauthorized.' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Update basic parameters
      await connection.query(
        `UPDATE elections 
         SET title = ?, description = ?, position = ?, start_date = ?, end_date = ?, 
             voting_start_time = ?, voting_end_time = ?, status = ?
         WHERE id = ? AND organizer_id = ?`,
        [title, description, position, startDate, endDate, votingStartTime, votingEndTime, status || 'draft', id, organizerId]
      );

      // 2. Re-map candidate relations: delete old links, write new links
      await connection.query('DELETE FROM election_candidates WHERE election_id = ?', [id]);
      
      if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
        const candidateValues = candidateIds.map(candId => [id, candId]);
        await connection.query(
          'INSERT INTO election_candidates (election_id, candidate_nomination_id) VALUES ?',
          [candidateValues]
        );
      }

      await connection.commit();
      connection.release();

      await logActivity({
        userId: organizerId,
        userRole: 'organizer',
        action: 'UPDATE_ELECTION',
        details: `Updated election settings for: "${title}" (ID: ${id})`,
        ipAddress: ip
      });

      return res.json({ message: 'Election updated successfully!' });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Update election error:', error);
    return res.status(500).json({ message: 'Server error updating election profiles.' });
  }
};

/**
 * Delete Election (Organizer only)
 */
const deleteElection = async (req, res) => {
  const { id } = req.params;
  const organizerId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const [rows] = await db.query('SELECT title FROM elections WHERE id = ? AND organizer_id = ?', [id, organizerId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Election record not found or unauthorized.' });
    }

    await db.query('DELETE FROM elections WHERE id = ? AND organizer_id = ?', [id, organizerId]);

    await logActivity({
      userId: organizerId,
      userRole: 'organizer',
      action: 'DELETE_ELECTION',
      details: `Deleted election record: "${rows[0].title}" (ID: ${id})`,
      ipAddress: ip
    });

    return res.json({ message: 'Election was deleted successfully.' });
  } catch (error) {
    console.error('Delete election error:', error);
    return res.status(500).json({ message: 'Server error deleting election record.' });
  }
};

/**
 * End Election manually/early
 */
const endElection = async (req, res) => {
  const { id } = req.params;
  const organizerId = req.user.id;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const [rows] = await db.query('SELECT title FROM elections WHERE id = ? AND organizer_id = ?', [id, organizerId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Election record not found or unauthorized.' });
    }

    // Force end by marking status as 'ended'
    await db.query('UPDATE elections SET status = "ended" WHERE id = ? AND organizer_id = ?', [id, organizerId]);

    await logActivity({
      userId: organizerId,
      userRole: 'organizer',
      action: 'END_ELECTION_MANUALLY',
      details: `Manually closed/ended election: "${rows[0].title}" (ID: ${id})`,
      ipAddress: ip
    });

    return res.json({ message: `Election "${rows[0].title}" has been successfully closed.` });
  } catch (error) {
    console.error('End election error:', error);
    return res.status(500).json({ message: 'Server error closing election.' });
  }
};

/**
 * Monitor Real-Time Election Progress / Results
 */
const getVotingProgress = async (req, res) => {
  const { id } = req.params;
  const organizerId = req.user.id;

  try {
    // Confirm ownership
    const [electionRows] = await db.query(
      'SELECT id, title, position, status, start_date, end_date, voting_start_time, voting_end_time FROM elections WHERE id = ? AND organizer_id = ?',
      [id, organizerId]
    );

    if (electionRows.length === 0) {
      return res.status(404).json({ message: 'Election record not found or unauthorized.' });
    }

    const election = electionRows[0];

    // Fetch candidates with their real-time vote count inside this election
    const [candidateVotes] = await db.query(
      `SELECT cn.id, cn.full_name, cn.position, cn.photo_path, cn.college_org,
       COUNT(v.id) AS vote_count
       FROM candidate_nominations cn
       JOIN election_candidates ec ON cn.id = ec.candidate_nomination_id
       LEFT JOIN votes v ON ec.election_id = v.election_id AND cn.id = v.candidate_nomination_id
       WHERE ec.election_id = ?
       GROUP BY cn.id
       ORDER BY vote_count DESC`,
      [id]
    );

    // Total votes cast so far
    const [totalVotesRow] = await db.query('SELECT COUNT(*) AS total FROM votes WHERE election_id = ?', [id]);

    return res.json({
      election,
      candidates: candidateVotes,
      totalVotesCast: totalVotesRow[0].total
    });
  } catch (error) {
    console.error('Fetch voting progress error:', error);
    return res.status(500).json({ message: 'Server error retrieving voting progress.' });
  }
};


module.exports = {
  getOrganizerDashboard,
  getApprovedCandidates,
  createElection,
  getElectionDetail,
  updateElection,
  deleteElection,
  endElection,
  getVotingProgress
};
