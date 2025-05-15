// routes/deputydirectorRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDeputydirector,
  getAllDeputydirectors,
  getDeputydirectorById,
  updateDeputydirector,
  deleteDeputydirector,
} = require('../controllers/deputydirectorController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, checkRole('Superadmin'), createDeputydirector)
  .get(protect, checkRole('Superadmin'), getAllDeputydirectors);

router.route('/:id')
  .get(protect, getDeputydirectorById)
  .put(protect, updateDeputydirector)
  .delete(protect, checkRole('Superadmin'), deleteDeputydirector);

module.exports = router;