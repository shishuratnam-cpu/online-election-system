const db = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * List elections available for voting (Voter view)
 */
const getAvailableElections = async (req, res) => {
  const voterId = req.user.id;

  try {
    // Fetch all published elections (active, upcoming, or completed)
    // We also attach whether this voter has already voted in each election
    const [rows] = await db.query(
      `SELECT e.*,
       CONCAT(e.start_date, ' ', e.voting_start_time) AS start_datetime,
       CONCAT(e.end_date, ' ', e.voting_end_time) AS end_datetime,
       CASE 
         WHEN CONCAT(e.start_date, ' ', e.voting_start_time) > NOW() THEN 'upcoming'
         WHEN CONCAT(e.end_date, ' ', e.voting_end_time) < NOW() OR e.status = 'ended' THEN 'completed'
         ELSE 'ongoing'
       END AS live_status,
       (SELECT COUNT(*) FROM votes WHERE election_id = e.id AND voter_id = ?) AS has_voted
       FROM elections e
       WHERE e.status = 'published' OR e.status = 'ended'
       ORDER BY e.created_at DESC`,
      [voterId]
    );

    return res.json({ elections: rows });
  } catch (error) {
    console.error('Fetch voter elections error:', error);
    return res.status(500).json({ message: 'Server error retrieving elections list.' });
  }
};

/**
 * Get details of a single election for the voter, including candidates
 */
const getVoterElectionDetail = async (req, res) => {
  const { id } = req.params;
  const voterId = req.user.id;

  try {
    // Fetch election info
    const [electionRows] = await db.query(
      `SELECT *,
       CONCAT(start_date, ' ', voting_start_time) AS start_datetime,
       CONCAT(end_date, ' ', voting_end_time) AS end_datetime,
       (SELECT COUNT(*) FROM votes WHERE election_id = id AND voter_id = ?) AS has_voted
       FROM elections WHERE id = ? AND (status = 'published' OR status = 'ended')`,
      [voterId, id]
    );

    if (electionRows.length === 0) {
      return res.status(404).json({ message: 'Election not found or not published.' });
    }

    const election = electionRows[0];

    // Determine current state
    const now = new Date();
    const start = new Date(election.start_datetime);
    const end = new Date(election.end_datetime);
    let liveStatus = 'ongoing';

    if (election.status === 'ended' || now > end) {
      liveStatus = 'completed';
    } else if (now < start) {
      liveStatus = 'upcoming';
    }

    election.live_status = liveStatus;

    // Fetch Candidates associated with this election
    const [candidates] = await db.query(
      `SELECT cn.id, cn.full_name, cn.position, cn.college_org, cn.photo_path, cn.manifesto_path
       FROM candidate_nominations cn
       JOIN election_candidates ec ON cn.id = ec.candidate_nomination_id
       WHERE ec.election_id = ?`,
      [id]
    );

    return res.json({
      election,
      candidates
    });
  } catch (error) {
    console.error('Fetch voter election details error:', error);
    return res.status(500).json({ message: 'Server error retrieving election.' });
  }
};

/**
 * Cast a Vote (Voter only)
 */
const castVote = async (req, res) => {
  const { electionId, candidateId } = req.body;
  const voterId = req.user.id;
  const voterName = req.user.name;
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // 1. Fetch the election
    const [electionRows] = await db.query(
      `SELECT *, 
       CONCAT(start_date, ' ', voting_start_time) AS start_datetime,
       CONCAT(end_date, ' ', voting_end_time) AS end_datetime
       FROM elections WHERE id = ? AND status = 'published'`,
      [electionId]
    );

    if (electionRows.length === 0) {
      return res.status(400).json({ message: 'Election is not open or does not exist.' });
    }

    const election = electionRows[0];

    // 2. Validate timeframe
    const now = new Date();
    const start = new Date(election.start_datetime);
    const end = new Date(election.end_datetime);

    console.log("Current Time :", now);
    console.log("Start Time   :", start);
    console.log("End Time     :", end);
    console.log("now < start :", now < start);
    console.log("now > end   :", now > end);

    if (now < start) {
      return res.status(400).json({ message: 'Voting has not started for this election yet.' });
    }
    if (now > end) {
      return res.status(400).json({ message: 'This election has already closed.' });
    }

    // 3. Validate candidate belongs to this election
    const [candidateCheck] = await db.query(
      'SELECT 1 FROM election_candidates WHERE election_id = ? AND candidate_nomination_id = ?',
      [electionId, candidateId]
    );
    if (candidateCheck.length === 0) {
      return res.status(400).json({ message: 'Selected candidate is not participating in this election.' });
    }

    // 4. Begin transaction for double vote checking (strict concurrency protection)
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if already voted
      const [existingVote] = await connection.query(
        'SELECT id FROM votes WHERE voter_id = ? AND election_id = ? FOR UPDATE',
        [voterId, electionId]
      );

      if (existingVote.length > 0) {
        connection.release();
        return res.status(400).json({ message: 'You have already cast your vote in this election. Duplicates are not allowed.' });
      }

      // Cast the vote
      await connection.query(
        `INSERT INTO votes (voter_id, election_id, candidate_nomination_id, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?)`,
        [voterId, electionId, candidateId, ip, userAgent]
      );

      await connection.commit();
      connection.release();

      await logActivity({
        userId: voterId,
        userRole: 'voter',
        action: 'CAST_VOTE',
        details: `Voter "${voterName}" successfully voted in election ID: ${electionId} for candidate ID: ${candidateId}`,
        ipAddress: ip
      });

      return res.status(201).json({ message: 'Your vote has been cast successfully! Thank you for participating.' });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Cast vote error:', error);
    return res.status(500).json({ message: 'Server error casting your vote.' });
  }
};

/**
 * Fetch Election Results (Visible only after election ends)
 */
const getElectionResults = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch election parameters
    const [electionRows] = await db.query(
      `SELECT *, 
       CONCAT(start_date, ' ', voting_start_time) AS start_datetime,
       CONCAT(end_date, ' ', voting_end_time) AS end_datetime
       FROM elections WHERE id = ?`,
      [id]
    );

    if (electionRows.length === 0) {
      return res.status(404).json({ message: 'Election record not found.' });
    }

    const election = electionRows[0];
    const now = new Date();
    const end = new Date(election.end_datetime);

    // Strict validation: Results visible only after election has ended (either manual status 'ended' or past end time)
    if (election.status !== 'ended' && now < end) {
      return res.status(403).json({ 
        message: 'Results are confidential and will be visible only after the voting period ends.',
        endsAt: election.end_datetime
      });
    }

    // Retrieve final results
    const [candidateResults] = await db.query(
      `SELECT cn.id, cn.full_name, cn.position, cn.photo_path, cn.college_org, cn.manifesto_path,
       COUNT(v.id) AS vote_count
       FROM candidate_nominations cn
       JOIN election_candidates ec ON cn.id = ec.candidate_nomination_id
       LEFT JOIN votes v ON ec.election_id = v.election_id AND cn.id = v.candidate_nomination_id
       WHERE ec.election_id = ?
       GROUP BY cn.id
       ORDER BY vote_count DESC`,
      [id]
    );

    // Total voter turnout
    const [turnoutRow] = await db.query('SELECT COUNT(*) AS total FROM votes WHERE election_id = ?', [id]);

    return res.json({
      election,
      candidates: candidateResults,
      totalVotesCast: turnoutRow[0].total
    });
  } catch (error) {
    console.error('Fetch election results error:', error);
    return res.status(500).json({ message: 'Server error retrieving election results.' });
  }
};

/**
 * Get Voter Personal Dashboard Stats & History
 */
const getVoterDashboard = async (req, res) => {
  const voterId = req.user.id;

  try {
    // 1. Total votes cast by this voter
    const [votedRows] = await db.query('SELECT COUNT(*) AS count FROM votes WHERE voter_id = ?', [voterId]);

    // 2. Active published elections currently open for voting
    const [openElections] = await db.query(
      `SELECT COUNT(*) AS count FROM elections 
       WHERE status = 'published'
       AND CONCAT(start_date, ' ', voting_start_time) <= NOW()
       AND CONCAT(end_date, ' ', voting_end_time) >= NOW()`
    );

    // 3. Voter History (list of votes and election details)
    const [history] = await db.query(
      `SELECT v.created_at AS voted_at, e.title, e.position, e.status,
       cn.full_name AS voted_for_candidate, cn.photo_path AS candidate_photo
       FROM votes v
       JOIN elections e ON v.election_id = e.id
       JOIN candidate_nominations cn ON v.candidate_nomination_id = cn.id
       WHERE v.voter_id = ?
       ORDER BY v.created_at DESC`,
      [voterId]
    );

    // 4. Notifications
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? AND user_role = 'voter' ORDER BY created_at DESC LIMIT 5",
      [voterId]
    );

    return res.json({
      stats: {
        votesCast: votedRows[0].count,
        availableElections: openElections[0].count
      },
      history,
      notifications
    });
  } catch (error) {
    console.error('Fetch voter dashboard error:', error);
    return res.status(500).json({ message: 'Server error retrieving voter profile metrics.' });
  }
};

module.exports = {
  getAvailableElections,
  getVoterElectionDetail,
  castVote,
  getElectionResults,
  getVoterDashboard
};
