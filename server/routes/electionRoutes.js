const express = require("express");
const router = express.Router();

const {
  createElection,
  getElections,
} = require("../controllers/electionController");

const { verifyToken, isOrganizer } = require("../middleware/auth");

// Create Election (Organizer only)
router.post("/", verifyToken, isOrganizer, createElection);

// View Elections
router.get("/", verifyToken, getElections);

module.exports = router;