const db = require("../config/db");

/**
 * Create Election
 */
const createElection = async (req, res) => {
  try {
    const {
      title,
      description,
      position,
      start_date,
      end_date,
      voting_start_time,
      voting_end_time,
    } = req.body;

    const organizer_id = req.user.id;

    const [result] = await db.query(
      `INSERT INTO elections
      (title, description, position,
      start_date, end_date,
      voting_start_time, voting_end_time,
      organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        position,
        start_date,
        end_date,
        voting_start_time,
        voting_end_time,
        organizer_id,
      ]
    );

    res.status(201).json({
      message: "Election created successfully.",
      electionId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

/**
 * Get All Elections
 */
const getElections = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM elections ORDER BY created_at DESC"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  createElection,
  getElections,
};