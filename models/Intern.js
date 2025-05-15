const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  CFF: { type: String, required: true },
  First_Name: { type: String, required: true },
  Last_Name: { type: String, required: true },
  Gender: { type: String, required: true },
  Nationality: { type: String, required: true },
  Sector: { type: String, required: true },
  hometown: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emplacement: { type: String, required: true },
  role: { type: String, default: 'intern', enum: ['intern'] },
  consommation: { 
    type: Number, 
    default: 0, 
    min: [0, 'La consommation ne peut pas être négative'] 
  },
  mealOptOuts: [{
    date: { type: Date, required: true },
    mealTypes: [{ type: String, enum: ['Breakfast', 'Lunch', 'Dinner'] }]
  }],
  image: { type: String, default: null },
  phoneNumber: { type: String },
  parentPhoneNumber: { type: String },
  totalPayment: { 
    type: Number, 
    default: 0, 
    min: [0, 'Le montant total payé ne peut pas être négatif'] 
  },
}, {
  timestamps: true,
});

const Intern = mongoose.model('Intern', internSchema);
module.exports = Intern;