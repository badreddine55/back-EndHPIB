const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const { getAllFormerInterns } = require('../controllers/internController');

router.use(protect);

router.get('/', checkRole('Deputydirector', 'Superadmin'), getAllFormerInterns);

module.exports = router;