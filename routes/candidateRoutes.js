// routes/candidateRoutes.js
const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware'); // Using your auth middleware
const {
  createCandidate,
  getAllCandidates,
  getCandidate,
  updateCandidate,
  deleteCandidate,
  updateCandidateStatus,
} = require('../controllers/candidateController');

// Restrict all routes to Deputydirector only
router.use(protect);              // Ensure user is authenticated
router.use(checkRole('Deputydirector')); // Restrict to Deputydirector role

// CRUD Routes
router.post('/', createCandidate);      // Create a new candidate
router.get('/', getAllCandidates);     // Get all candidates
router.get('/:id', getCandidate);      // Get a candidate by ID
router.put('/:id', updateCandidate);   // Update a candidate by ID
router.delete('/:id', deleteCandidate); // Delete a candidate by ID
// PATCH: Select candidate and set first payment


router.patch("/:id/status",updateCandidateStatus);

module.exports = router;