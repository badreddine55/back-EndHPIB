const mongoose = require('mongoose');

const formerInternSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', default: null },
  CFF: { type: String, required: true, unique: true },
  First_Name: { type: String, required: true },
  Last_Name: { type: String, required: true },
  Gender: { type: String, enum: ['Male', 'Female'], required: true },
  Nationality: { type: String, required: true },
  Sector: { type: String, required: true },
  hometown: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emplacement: { type: String, required: true },
  role: { type: String, default: 'intern' },
  consommation: { type: Number, default: 0 },
  mealOptOuts: [{ date: Date, mealTypes: [String] }],
  image: { type: String, default: null },
  phoneNumber: { type: String, default: '' },
  parentPhoneNumber: { type: String, default: '' },
  totalPayment: { type: Number, default: 0 },
  entryDate: { type: Date, required: true },
  exitDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('FormerIntern', formerInternSchema);