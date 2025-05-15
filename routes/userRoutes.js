const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware'); // Assuming this is your middleware file
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// Restrict all routes to Superadmin only
router.use(protect); // Ensure user is authenticated
router.use(checkRole('Superadmin')); // Restrict to Superadmin role

// CRUD Routes
router.post('/', createUser);           // Create a new user
router.get('/', getAllUsers);          // Get all users
router.get('/:id', getUserById);       // Get a user by ID
router.put('/:id', updateUser);        // Update a user by ID
router.delete('/:id', deleteUser);     // Delete a user by ID

module.exports = router;