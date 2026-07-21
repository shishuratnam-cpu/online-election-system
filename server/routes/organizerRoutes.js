const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  getOrganizerDashboard, 
  getApprovedCandidates, 
  createElection, 
  getElectionDetail, 
  updateElection, 
  deleteElection, 
  endElection, 
  getVotingProgress
} = require('../controllers/organizerController');
const { verifyToken, isOrganizer } = require('../middleware/auth');

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Protect routes
router.use(verifyToken, isOrganizer);

// Dashboard
router.get('/dashboard', getOrganizerDashboard);

// Candidates fetch for inclusion
router.get('/approved-candidates', getApprovedCandidates);

// Election CRUD
router.post(
  '/elections',
  [
    body('title').trim().notEmpty().withMessage('Election title is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('position').trim().notEmpty().withMessage('Target position is required.'),
    body('startDate').isDate().withMessage('Start date must be a valid date (YYYY-MM-DD).'),
    body('endDate').isDate().withMessage('End date must be a valid date (YYYY-MM-DD).'),
    body('votingStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Start time must be HH:MM format.'),
    body('votingEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('End time must be HH:MM format.'),
    body('candidateIds').isArray({ min: 1 }).withMessage('Select at least one candidate for this election.')
  ],
  validate,
  createElection
);

router.get('/elections/:id', getElectionDetail);

router.put(
  '/elections/:id',
  [
    body('title').trim().notEmpty().withMessage('Election title is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('position').trim().notEmpty().withMessage('Target position is required.'),
    body('startDate').isDate().withMessage('Start date must be a valid date.'),
    body('endDate').isDate().withMessage('End date must be a valid date.'),
    body('votingStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Start time is required.'),
    body('votingEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('End time is required.'),
    body('candidateIds').isArray({ min: 1 }).withMessage('Select at least one candidate.')
  ],
  validate,
  updateElection
);

router.delete('/elections/:id', deleteElection);

// Manually Close Voting
router.put('/elections/:id/end', endElection);

// Monitor voting progress in real-time
router.get('/elections/:id/progress', getVotingProgress);

module.exports = router;
