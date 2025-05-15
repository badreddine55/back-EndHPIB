const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const { submitReport, getAllReports, updateReport, deleteReport,getMyReports } = require('../controllers/reportController');

// Protect all routes with authentication
router.use(protect);

// Submit a report (Intern, Deputydirector, Chef)
router.post('/submit', checkRole('Intern', 'Deputydirector', 'Chef'), submitReport);

// Get all reports (Super Admin only)
router.get('/', checkRole('Superadmin'), getAllReports);

// Update a report (Submitter or Super Admin)
router.put('/update',checkRole('Intern', 'Deputydirector', 'Chef'), updateReport);

// Delete a report (Submitter or Super Admin)
router.delete('/delete',checkRole('intern', 'Deputydirector', 'Chef'), deleteReport);
router.get('/my-reports', checkRole('intern', 'Deputydirector', 'Chef'), getMyReports);

module.exports = router;