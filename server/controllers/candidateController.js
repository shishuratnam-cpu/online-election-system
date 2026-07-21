const db = require('../config/db');
const { logActivity } = require('../utils/logger');
const { sendEmail } = require('../utils/email');

/**
 * Submit Candidate Nomination
 */
const submitNomination = async (req, res) => {
  const { fullName, email, mobile, address, collegeOrg, position, dob, declarationChecked } = req.body;
  const ip = req.ip || req.socket.remoteAddress;

  try {
    // 1. Validate declaration
    if (declarationChecked !== 'true' && declarationChecked !== '1' && declarationChecked !== true) {
      return res.status(400).json({ message: 'You must check the declaration box to submit your nomination.' });
    }

    // 2. Validate uploaded files
    if (!req.files || !req.files['photo'] || !req.files['govtId'] || !req.files['manifesto']) {
      return res.status(400).json({ 
        message: 'Nomination requires uploading: (1) Photo, (2) Government ID document, and (3) Manifesto document.' 
      });
    }

    const photoPath = '/uploads/' + req.files['photo'][0].filename;
    const govtIdPath = '/uploads/' + req.files['govtId'][0].filename;
    const manifestoPath = '/uploads/' + req.files['manifesto'][0].filename;

    // 3. Prevent duplicate nominations
    const [existing] = await db.query('SELECT id, status FROM candidate_nominations WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        message: `A candidate nomination with the email ${email} has already been submitted (Current status: ${existing[0].status}).` 
      });
    }

    // 4. Save Nomination
    const [result] = await db.query(
      `INSERT INTO candidate_nominations 
       (full_name, email, mobile, address, college_org, position, dob, photo_path, id_path, manifesto_path, status, declaration_checked) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`,
      [fullName, email, mobile, address, collegeOrg, position, dob, photoPath, govtIdPath, manifestoPath]
    );

    const nominationId = result.insertId;

    // Log Activity
    await logActivity({
      userId: null,
      userRole: 'candidate',
      action: 'SUBMIT_NOMINATION',
      details: `Nomination submitted for: ${fullName} (${position})`,
      ipAddress: ip
    });

    // Send confirmation email to candidate
    await sendEmail({
      to: email,
      subject: 'Candidate Nomination Submitted - Online Election System',
      text: `Hello ${fullName},\n\nYour nomination for the position of "${position}" has been received successfully.\n\nYour application is currently PENDING approval from the Election Administrator. We will notify you once a decision is made.\n\nBest Regards,\nElection Management Board`
    });

    return res.status(201).json({
      message: 'Your candidate nomination was submitted successfully! It is now pending review.',
      nominationId
    });
  } catch (error) {
    console.error('Candidate nomination submission error:', error);
    return res.status(500).json({ message: 'Server error while submitting nomination.' });
  }
};

module.exports = {
  submitNomination
};
