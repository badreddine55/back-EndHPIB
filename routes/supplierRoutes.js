// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createSupplier, 
  getAllSuppliers, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier 
} = require('../controllers/supplierController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Routes with middleware for authentication and role-based access
router.route('/')
  .post(protect, checkRole('Superadmin', 'Deputydirector'), createSupplier) // Only Superadmin or Deputydirector can create
  .get(protect, checkRole('Superadmin', 'Deputydirector'), getAllSuppliers); // Only Superadmin or Deputydirector can view all

router.route('/:id')
  .get(protect, checkRole('Superadmin', 'Deputydirector'), getSupplierById) // View single supplier
  .put(protect, checkRole('Superadmin', 'Deputydirector'), updateSupplier) // Update supplier
  .delete(protect, checkRole('Superadmin', 'Deputydirector'), deleteSupplier); // Delete supplier

module.exports = router;