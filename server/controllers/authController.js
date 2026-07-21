const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { logActivity } = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';


/**
 * Register a new voter
 */
const registerVoter = async (req, res) => {

  const { voter_id, password } = req.body;

  try {

    const [existingVoter] = await db.query(
      "SELECT id FROM voters WHERE voter_id = ?",
      [voter_id]
    );


    if (existingVoter.length > 0) {
      return res.status(400).json({
        message: "Voter ID already exists"
      });
    }


    const salt = await bcrypt.genSalt(10);

    const passwordHash = await bcrypt.hash(
      password,
      salt
    );


    await db.query(
      `INSERT INTO voters
      (voter_id, password_hash)
      VALUES (?, ?)`,
      [
        voter_id,
        passwordHash
      ]
    );


    return res.status(201).json({
      message:"Voter created successfully"
    });


  } catch(error){

    console.log("CREATE VOTER ERROR:", error);


    return res.status(500).json({
      message:error.message
    });

  }

};
/**
 * Voter Login
 */
const loginVoter = async (req, res) => {
  console.log("===== LOGIN REQUEST =====");
  console.log(req.body);

  const { voterId, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  try {

    const [rows] = await db.query(
      'SELECT * FROM voters WHERE voter_id = ?',
      [voterId]
    );
    console.log("Rows returned:", rows);


    if (rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid Voter ID or password.'
      });
    }


    const voter = rows[0];


    if (voter.status === 'disabled') {
      return res.status(403).json({
        message: 'Your account is disabled. Please contact administrator.'
      });
    }


    const isMatch = await bcrypt.compare(
      password,
      voter.password_hash
    );


    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid Voter ID or password.'
      });
    }


    // Create JWT token
    const token = jwt.sign(
      {
        id: voter.id,
        voter_id: voter.voter_id,
        role: 'voter'
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );


    await logActivity({
      userId: voter.id,
      userRole: 'voter',
      action: 'VOTER_LOGIN',
      details: `Voter logged in: ${voter.voter_id}`,
      ipAddress: ip
    });


    return res.json({
      token,
      user: {
        id: voter.id,
        voter_id: voter.voter_id,
        role: 'voter'
      }
    });


  } catch (error) {

    console.error('Voter login error:', error);

    return res.status(500).json({
      message: 'Server error during login.'
    });

  }
};

/**
 * Organizer Login (Requires Username, Unique Number, Password)
 */
const loginOrganizer = async (req, res) => {
  const { username, uniqueNumber, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    // Validate matching all three details
    const [rows] = await db.query(
      'SELECT * FROM organizers WHERE username = ? AND unique_number = ?',
      [username, uniqueNumber]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username, unique number, or password.' });
    }

    const organizer = rows[0];

    if (organizer.status === 'disabled') {
      return res.status(403).json({ message: 'Your account is disabled. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, organizer.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username, unique number, or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: organizer.id, username: organizer.username, uniqueNumber: organizer.unique_number, role: 'organizer' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logActivity({
      userId: organizer.id,
      userRole: 'organizer',
      action: 'ORGANIZER_LOGIN',
      details: `Organizer logged in: ${organizer.username} (${organizer.unique_number})`,
      ipAddress: ip
    });

    return res.json({
      token,
      user: {
        id: organizer.id,
        username: organizer.username,
        uniqueNumber: organizer.unique_number,
        role: 'organizer'
      }
    });
  } catch (error) {
    console.error('Organizer login error:', error);
    return res.status(500).json({ message: 'Server error during organizer login.' });
  }
};

/**
 * Admin Login
 */
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  console.log("Request Body:", req.body);
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const admin = rows[0];

    console.log("Entered Password:", password);
    console.log("Stored Hash:", admin.password_hash);

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    console.log("Password Match:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logActivity({
      userId: admin.id,
      userRole: 'admin',
      action: 'ADMIN_LOGIN',
      details: `Admin logged in: ${admin.username}`,
      ipAddress: ip
    });

    return res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error during admin login.' });
  }
};

/**
 * Forgot Password (Request reset token)
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    // Check if email belongs to voter, organizer or admin
    let userFound = null;
    let role = '';

    // Search Voter
    const [voterRows] = await db.query('SELECT id, name FROM voters WHERE email = ?', [email]);
    if (voterRows.length > 0) {
      userFound = voterRows[0];
      role = 'voter';
    }

    // Search Admin (if not voter)
    if (!userFound) {
      const [adminRows] = await db.query('SELECT id, username AS name FROM admin WHERE email = ?', [email]);
      if (adminRows.length > 0) {
        userFound = adminRows[0];
        role = 'admin';
      }
    }

    if (!userFound) {
      // NOTE: For security, we don't disclose that the email does not exist, but here we will return structured response
      return res.status(404).json({ message: 'No registered account found with this email address.' });
    }

    // Generate random crypto reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete existing tokens for this email first
    await db.query('DELETE FROM password_resets WHERE email = ?', [email]);

    // Insert Reset Token
    await db.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, hashedToken, expiresAt]
    );

    // Send Email containing reset link (simulate frontend URL on localhost:5173)
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    await logActivity({
      userId: userFound.id,
      userRole: role,
      action: 'FORGOT_PASSWORD_REQUEST',
      details: `Password reset requested for: ${email}`,
      ipAddress: ip
    });

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Hello ${userFound.name},\n\nYou requested a password reset for your Online Election Portal account.\n\nPlease click on the following link to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`
    });

    return res.json({ message: 'Password reset link sent! Please check your email inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error during password reset request.' });
  }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Retrieve token details
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()',
      [email, hashedToken]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update matching user table password (Voter or Admin)
    let role = 'voter';
    const [voterUpdate] = await db.query(
      'UPDATE voters SET password_hash = ? WHERE email = ?',
      [newPasswordHash, email]
    );

    if (voterUpdate.affectedRows === 0) {
      const [adminUpdate] = await db.query(
        'UPDATE admin SET password_hash = ? WHERE email = ?',
        [newPasswordHash, email]
      );
      if (adminUpdate.affectedRows > 0) {
        role = 'admin';
      }
    }

    // Clean up reset token
    await db.query('DELETE FROM password_resets WHERE email = ?', [email]);

    await logActivity({
      userId: null,
      userRole: role,
      action: 'PASSWORD_RESET_SUCCESS',
      details: `Password reset successfully completed for: ${email}`,
      ipAddress: ip
    });

    return res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error during password reset execution.' });
  }
};

/**
 * Fetch Current User Profile
 */
const getProfile = async (req, res) => {
  const { id, role } = req.user;

  try {
    if (role === 'voter') {
      const [rows] = await db.query(
        'SELECT id, name, email, mobile, dob, address, created_at FROM voters WHERE id = ?',
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Voter not found.' });
      return res.json({ profile: rows[0], role });
    } else if (role === 'organizer') {
      const [rows] = await db.query(
        'SELECT id, username, unique_number, status, created_at FROM organizers WHERE id = ?',
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Organizer not found.' });
      return res.json({ profile: rows[0], role });
    } else if (role === 'admin') {
      const [rows] = await db.query(
        'SELECT id, username, email, created_at FROM admin WHERE id = ?',
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Admin not found.' });
      return res.json({ profile: rows[0], role });
    }

    return res.status(400).json({ message: 'Invalid user role.' });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ message: 'Server error fetching user profile.' });
  }
};

/**
 * Change Password (while logged in)
 */
const changePassword = async (req, res) => {
  const { id, role } = req.user;
  const { oldPassword, newPassword } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    let tableName = '';
    if (role === 'voter') tableName = 'voters';
    else if (role === 'organizer') tableName = 'organizers';
    else if (role === 'admin') tableName = 'admin';
    else return res.status(400).json({ message: 'Invalid role.' });

    // Fetch user details including password hash
    const [rows] = await db.query(`SELECT password_hash FROM \`${tableName}\` WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify old password
    const userRow = rows[0];
    const isMatch = await bcrypt.compare(oldPassword, userRow.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(`UPDATE \`${tableName}\` SET password_hash = ? WHERE id = ?`, [newHash, id]);

    // Log Activity
    await logActivity({
      userId: id,
      userRole: role,
      action: 'CHANGE_PASSWORD',
      details: 'User successfully updated their password.',
      ipAddress: ip
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error during password update.' });
  }
};

module.exports = {
  registerVoter,
  loginVoter,
  loginOrganizer,
  loginAdmin,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword
};
