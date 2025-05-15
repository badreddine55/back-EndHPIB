// models/Deputydirector.js
const mongoose = require('mongoose');

const DeputydirectorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Le nom est requis'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'L\'email est requis'], 
    unique: true, 
    trim: true, 
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Veuillez entrer une adresse email valide']
  },
  password: { 
    type: String, 
    required: [true, 'Le mot de passe est requis'], 
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  phoneNumber: { 
    type: String, 
    trim: true,
  },
  address: { 
    type: String, 
    trim: true 
  },
  dateOfBirth: { 
    type: Date 
  },
  role: { 
    type: String, 
    enum: ['Deputydirector'], 
    default: 'Deputydirector' 
  },
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpires: { 
    type: Date 
  },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Deputydirector', DeputydirectorSchema);