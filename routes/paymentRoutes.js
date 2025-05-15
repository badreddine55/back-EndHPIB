const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Restrict all routes to Deputydirector only
router.use(protect);   
router.get('/total',checkRole('Deputydirector','Superadmin'), paymentController.getTotalPayments);  
router.get('/',checkRole('Deputydirector','Superadmin'), paymentController.getAllPayments);  
router.use(checkRole('Deputydirector')); // Restrict to Deputydirector role

// Routes for payment management
router.post('/', paymentController.createPaymentForIntern); // Create payment record
router.get('/', paymentController.getAllPayments);         // Get all payments
router.get('/:internId', paymentController.getPaymentByInternId); // Get payment by intern ID
router.patch('/:internId', paymentController.updatePayment); // Update payment status
module.exports = router;