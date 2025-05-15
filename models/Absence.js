const mongoose = require('mongoose');

const AbsenceSchema = new mongoose.Schema({
  stagerName: { type: String, required: true }, // Intern's full name
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Absence', AbsenceSchema);