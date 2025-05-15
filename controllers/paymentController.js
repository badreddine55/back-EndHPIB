const Payment = require('../models/Payment');
const Intern = require('../models/Intern');

// Helper function to get the current academic year
const getAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

// Create a payment record when an intern is confirmed
const createPaymentForIntern = async (req, res) => {
  const { internId } = req.body;

  try {
    // Verify the intern exists
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }

    // Get current month and academic year
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const academicYear = getAcademicYear();

    // Check if payment record already exists for this intern and academic year
    let payment = await Payment.findOne({ internId, academicYear });
    if (payment) {
      return res.status(400).json({ success: false, message: 'Payment record already exists for this intern and academic year' });
    }

    // Create new payment record with current month marked as paid
    payment = new Payment({
      internId,
      academicYear,
      payments: { [currentMonth]: 200 }, // Default payment amount of 200 DH
      totalAmount: 200,
    });

    await payment.save();
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all payment records
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('internId', 'First_Name Last_Name CFF');
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment record for a specific intern
const getPaymentByInternId = async (req, res) => {
  const { internId } = req.params;

  try {
    const payment = await Payment.findOne({ internId }).populate('internId', 'First_Name Last_Name CFF');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status for specific months
const updatePayment = async (req, res) => {
  const { internId } = req.params;
  const { months, amount } = req.body; // months: array of month names, amount: payment amount per month

  if (!months || !Array.isArray(months) || months.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide an array of months to update' });
  }
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid payment amount' });
  }

  try {
    const payment = await Payment.findOne({ internId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Update the specified months with the payment amount
    months.forEach((month) => {
      if (payment.payments.hasOwnProperty(month)) {
        payment.payments[month] = amount;
      }
    });

    // Recalculate total amount
    payment.totalAmount = Object.values(payment.payments).reduce((sum, val) => sum + val, 0);

    await payment.save();
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getTotalPayments = async (req, res) => {
  try {
    // Get current academic year using the existing helper function
    const currentAcademicYear = getAcademicYear();

    // Find all payment records for the current academic year
    const payments = await Payment.find({ academicYear: currentAcademicYear });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No payment records found for academic year ${currentAcademicYear}` 
      });
    }

    // Calculate grand total by summing all totalAmount fields
    const grandTotal = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);

    // Calculate monthly breakdown (optional)
    const monthlyTotals = {
      September: 0,
      October: 0,
      November: 0,
      December: 0,
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0
    };

    payments.forEach(payment => {
      Object.keys(monthlyTotals).forEach(month => {
        monthlyTotals[month] += payment.payments[month] || 0;
      });
    });

    const stats = {
      totalAmount: grandTotal,
      numberOfInterns: payments.length,
      averagePerIntern: payments.length > 0 ? grandTotal / payments.length : 0,
      academicYear: currentAcademicYear,
      monthlyBreakdown: monthlyTotals
    };

    res.status(200).json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createPaymentForIntern,
  getAllPayments,
  getPaymentByInternId,
  updatePayment,
  getTotalPayments,
};