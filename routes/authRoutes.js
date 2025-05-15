const express = require('express');
const router = express.Router();
const { login, forgetPassword, resetPassword, getMe ,updateMe} = require('../controllers/authController'); // Add getMe
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/forgot-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe); // Add this route
router.put('/me', protect, updateMe);
module.exports = router;