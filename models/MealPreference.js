const mongoose = require('mongoose');

const MealPreferenceSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern' },
  stagerName: String,
  day: String,
  breakfast: String,
  lunch: String,
  dinner: String
});

module.exports = mongoose.model('MealPreference', MealPreferenceSchema);