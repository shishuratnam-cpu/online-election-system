const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  getAvailableElections, 
  getVoterElectionDetail, 
  castVote, 
  getElectionResults, 
  getVoterDashboard 
} = require('../controllers/voteController');
const { verifyToken, isVoter } = require('../middleware/auth');

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Protect all voting routes for registered and logged-in voters
router.use(verifyToken, isVoter);

// Voter dashboard stats & activity history
router.get('/dashboard', getVoterDashboard);

// Available elections list & detail
router.get('/elections', getAvailableElections);
router.get('/elections/:id', getVoterElectionDetail);

// Cast vote
router.post(
  '/cast',
  [
    body('electionId').isInt().withMessage('Valid Election ID is required.'),
    body('candidateId').isInt().withMessage('Valid Candidate ID is required.')
  ],
  validate,
  castVote
);

// View ended election results
router.get('/results/:id', getElectionResults);

module.exports = router;
