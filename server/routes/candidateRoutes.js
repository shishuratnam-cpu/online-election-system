const express = require('express');
const router = express.Router();
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { submitNomination } = require('../controllers/candidateController');
const { candidateNominationUpload } = require('../middleware/upload');

// Clean up uploaded files in case validation fails
const cleanUpFiles = (req) => {
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      req.files[key].forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    });
  }
};

const validateNomination = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
  body('address').trim().notEmpty().withMessage('Physical address is required.'),
  body('collegeOrg').trim().notEmpty().withMessage('College/Organization name is required.'),
  body('position').trim().notEmpty().withMessage('Specify the position you are applying for.'),
  body('dob').isDate().withMessage('Provide a valid date of birth (YYYY-MM-DD).'),
  body('declarationChecked').custom(val => {
    if (val !== 'true' && val !== '1' && val !== true) {
      throw new Error('Declaration checkbox must be checked.');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      cleanUpFiles(req); // Delete uploaded files to prevent orphaned uploads
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Submit nomination route (multipart form handler + validations + controller)
router.post('/nominate', candidateNominationUpload, validateNomination, submitNomination);

module.exports = router;
