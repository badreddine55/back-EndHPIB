const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
  academicYear: { type: String, required: true },
  payments: {
    September: { type: Number, default: 0 },
    October: { type: Number, default: 0 },
    November: { type: Number, default: 0 },
    December: { type: Number, default: 0 },
    January: { type: Number, default: 0 },
    February: { type: Number, default: 0 },
    March: { type: Number, default: 0 },
    April: { type: Number, default: 0 },
    May: { type: Number, default: 0 },
    June: { type: Number, default: 0 },
    July: { type: Number, default: 0 },
    August: { type: Number, default: 0 },
  },
  totalAmount: { type: Number, default: 0 },
  observation: { type: String, default: '' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', PaymentSchema);