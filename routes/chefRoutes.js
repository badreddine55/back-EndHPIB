// routes/chefRoutes.js
const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const {
  createChef,
  getAllChefs,
  getChefById,
  updateChef,
  deleteChef,
  resetChefPassword,
} = require('../controllers/chefController');

router.route('/')
  .post(protect, checkRole('Superadmin','Deputydirector'), createChef)
  .get(protect, checkRole('Superadmin','Deputydirector'), getAllChefs);

router.route('/:id')
  .get(protect, checkRole('Superadmin','Deputydirector'), getChefById)
  .put(protect, checkRole('Superadmin','Deputydirector'), updateChef)
  .delete(protect, checkRole('Superadmin','Deputydirector'), deleteChef);

router.put('/:id/reset-password', protect, checkRole('Superadmin','Deputydirector'), resetChefPassword);

module.exports = router;