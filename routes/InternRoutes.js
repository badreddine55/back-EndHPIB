const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const {
  createInternAndRemoveCandidate,
  getAllInterns,
  deleteIntern,
  updateInternPassword,
  checkEmplacement,
  updateIntern,
  getInternById,
  uploadProfileImage,
  getTotalConsumption,
  calculateAndResetPayments,
  removeInternToFormer,
} = require('../controllers/internController');

// Protect all routes
router.use(protect);

// Allow both Deputydirector and Chef to get all interns
router.get('/', checkRole('Deputydirector', 'Chef', 'Superadmin'), getAllInterns);
router.get('/totalConsumption', checkRole('Deputydirector', 'Superadmin'), getTotalConsumption);
router.post('/calculate-and-reset-payments', checkRole('Deputydirector', 'Superadmin'), calculateAndResetPayments);
router.post('/:id/remove-to-former', checkRole('Deputydirector', 'Superadmin'), removeInternToFormer);
router.put('/:id', checkRole('Deputydirector', 'Superadmin'), updateIntern);
router.get('/:id', checkRole('Deputydirector', 'Superadmin'), getInternById);
router.get('/check-emplacement/:emplacement', checkRole('Deputydirector', 'Superadmin'), checkEmplacement);
// Intern-specific routes
router.post('/upload-image', checkRole('intern'), uploadProfileImage);

// Restrict remaining routes to Deputydirector only
router.use(checkRole('Deputydirector'));

router.post('/', createInternAndRemoveCandidate);
router.put('/:id/password', updateInternPassword);
router.delete('/:id', deleteIntern);

module.exports = router;