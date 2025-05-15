const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const {
  submitReport,
  getPendingAbsences,
  handleAbsenceRequest,
} = require('../controllers/absenceController');
const Absence = require('../models/Absence');

// Protect all routes (require authentication)
router.use(protect);

// Routes for Interns
router.post('/', 
  checkRole('intern'), // Restrict to Intern role (case-sensitive as per your middleware)
  submitReport
);

router.get('/my-absences', 
  checkRole('intern'), // Restrict to Intern role
  async (req, res) => {
    try {
      const absences = await Absence.find({ internId: req.user.id })
        .populate('internId', 'First_Name Last_Name');
      res.status(200).json({ success: true, data: absences });
    } catch (error) {
      console.error('Error fetching absence history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch absence history',
        error: error.message,
      });
    }
  }
);

// Restrict remaining routes to Deputydirector only
router.use(checkRole('Deputydirector'));

router.get('/pending', getPendingAbsences);         // Deputy Director views pending absence requests
router.post('/handle', handleAbsenceRequest);       // Deputy Director approves/rejects absence requests

module.exports = router;