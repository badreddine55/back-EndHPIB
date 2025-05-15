
const Absence = require('../models/Absence');
const Intern = require('../models/Intern');

const Meal = require('../models/Meal');

// Submit a report (Intern submits absence request)
exports.submitReport = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const internId = req.user.id;
    const stagerName = `${req.user.First_Name} ${req.user.Last_Name}`;

    // Validate required fields
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'startDate, endDate, and reason are required for absence requests',
      });
    }

    // Additional validation for dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'endDate cannot be earlier than startDate',
      });
    }

    // Create new absence request
    const absence = new Absence({
      stagerName,
      startDate: start,
      endDate: end,
      reason,
      status: 'pending',
      internId,
    });

    // Save to database
    const savedAbsence = await absence.save();

    // Success response
    res.status(201).json({
      success: true,
      data: savedAbsence,
      message: 'Absence request submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    
    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message,
    });
  }
};
// Get all pending absence requests (Deputy Director)
exports.getPendingAbsences = async (req, res) => {
  try {
    const absences = await Absence.find({ status: 'pending' }).populate(
      'internId',
      'First_Name Last_Name email emplacement'
    );
    res.status(200).json({ success: true, data: absences });
  } catch (error) {
    console.error('Error fetching pending absences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending absences',
      error: error.message,
    });
  }
};

exports.handleAbsenceRequest = async (req, res) => {
  try {
    const { absenceId, action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "approve" or "reject"' });
    }

    const absence = await Absence.findById(absenceId);
    if (!absence) {
      return res.status(404).json({ success: false, message: 'Absence request not found' });
    }

    absence.status = action === 'approve' ? 'approved' : 'rejected';
    await absence.save();

    // If approved, automatically opt out of meals for the absence period
    if (action === 'approve') {
      const intern = await Intern.findById(absence.internId);
      if (!intern) {
        return res.status(404).json({ success: false, message: 'Intern not found' });
      }

      const startDate = new Date(absence.startDate);
      const endDate = new Date(absence.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Fetch all meals within the absence period
      const meals = await Meal.find({
        date: { $gte: startDate, $lte: endDate },
      });

      // Default meal types to opt out of (assuming Breakfast, Lunch, Dinner)
      const allMealTypes = ['Breakfast', 'Lunch', 'Dinner'];

      // Iterate over each day in the absence period
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = currentDate.toDateString();
        const existingOptOutIndex = intern.mealOptOuts.findIndex(
          (opt) => new Date(opt.date).toDateString() === dateString
        );

        if (existingOptOutIndex === -1) {
          // Add new opt-out entry for the day
          intern.mealOptOuts.push({
            date: new Date(currentDate),
            mealTypes: allMealTypes,
          });
        } else {
          // Update existing entry to include all meal types
          intern.mealOptOuts[existingOptOutIndex].mealTypes = [
            ...new Set([...intern.mealOptOuts[existingOptOutIndex].mealTypes, ...allMealTypes]),
          ];
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      await intern.save();
    }

    res.status(200).json({
      success: true,
      data: absence,
      message: `Absence request ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error handling absence request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle absence request',
      error: error.message,
    });
  }
};

// Get absence history for the logged-in intern (moved to routes, but included here for reference)
// This is now handled directly in the routes file as per your syntax example

module.exports = exports;