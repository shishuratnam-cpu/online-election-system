const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
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
} = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply verifyToken and isAdmin to all admin routes
router.use(verifyToken, isAdmin);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/charts', getChartData);

// Organizer Management
router.get('/organizers', getOrganizers);

router.post(
  '/organizers',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('uniqueNumber').trim().notEmpty().withMessage('Unique registration number is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  ],
  validate,
  createOrganizer
);

router.put(
  '/organizers/:id/password',
  [
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
  ],
  validate,
  resetOrganizerPassword
);

router.put('/organizers/:id/status', toggleOrganizerStatus);
router.delete('/organizers/:id', deleteOrganizer);

// Voter Management
router.get('/voters', getVoters);


router.post(
    '/voters',
    [
        body('voter_id')
            .trim()
            .notEmpty()
            .withMessage('Voter ID is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validate,
    createVoter
);

router.put('/voters/:id/status', toggleVoterStatus);

router.delete('/voters/:id', deleteVoter);

// Candidate Nomination approvals
router.get('/nominations', getNominations);
router.get('/nominations/:id', getNominationDetail);
router.put('/nominations/:id/status', updateNominationStatus);
router.delete('/nominations/:id', deleteNomination);

// Audit Trails & Reports
router.get('/audit', getAuditLogs);
router.get('/export', exportReport);
router.put("/profile", updateAdminProfile);
module.exports = router;
