// models/Chef.js
const mongoose = require('mongoose');

const ChefSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'Le prénom est requis'], 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: [true, 'Le nom est requis'], 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    required: [true, 'Le numéro de téléphone est requis'], 
    trim: true 
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  role: { 
    type: String, 
    default: 'Chef', 
    enum: ['Chef'] // Ensures only "Chef" is allowed
  },
  grade: {
    type: String,
    required: [true, 'Le grade est requis'],
    enum: ['Chef', 'Sous Chef', 'Pastry Chef', 'Line Cook'],
    default: 'Chef'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chef', ChefSchema);