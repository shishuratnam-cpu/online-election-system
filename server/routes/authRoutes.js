const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  registerVoter, 
  loginVoter, 
  loginOrganizer, 
  loginAdmin, 
  forgotPassword, 
  resetPassword, 
  getProfile,
  changePassword
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Voter Register route with validation rules
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
    body('dob').isDate().withMessage('Enter a valid date of birth (YYYY-MM-DD).'),
    body('address').trim().notEmpty().withMessage('Address is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
  ],
  validate,
  registerVoter
);

// Login routes
router.post('/login/voter', loginVoter);
router.post('/login/organizer', loginOrganizer);
router.post('/login/admin', loginAdmin);

// Password recovery routes
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Enter a valid email address.')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Enter a valid email.'),
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
  ],
  validate,
  resetPassword
);

// Get current user profile route
router.get('/profile', verifyToken, getProfile);

// Change password route (while logged in)
router.post(
  '/change-password',
  verifyToken,
  [
    body('oldPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
  ],
  validate,
  changePassword
);

module.exports = router;
