// routes/zoneRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllZones,
  createZone,
  updateZone,
  deleteZone
} = require('../controllers/zoneController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Routes for Superadmin and DeputyDirector
router.route('/')
  .get(protect, checkRole('Deputydirector', 'Superadmin','Chef'), getAllZones)
  .post(protect, checkRole('Deputydirector'), createZone);

router.route('/:id')
  .put(protect, checkRole('Deputydirector'), updateZone)
  .delete(protect, checkRole('Deputydirector'), deleteZone);

module.exports = router;