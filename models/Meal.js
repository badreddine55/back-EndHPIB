const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  mealName: { 
    type: String, 
    required: [true, 'Le nom du repas est requis'], 
    trim: true 
  },
  type: { 
    type: String, 
    required: [true, 'Le type de repas est requis'], 
    enum: ['Breakfast', 'Lunch', 'Dinner'], 
    trim: true 
  },
  date: { 
    type: Date, 
    required: [true, 'La date est requise'], 
    default: Date.now 
  },
  priceOfMeal: { 
    type: Number, 
    required: [true, 'Le prix du repas est requis'], 
    min: [0, 'Le prix ne peut pas être négatif'] 
  },
  mealPhoto: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meal', MealSchema);