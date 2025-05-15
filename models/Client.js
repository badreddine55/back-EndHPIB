// models/client.js
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true // Allows null values for potential non-Google clients
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['client'], // Restricted to 'client' since this is a Client model
    default: 'client' 
  },
  phoneNumber: { 
    type: String 
  },
  address: { 
    type: String 
  },
  dateOfBirth: { 
    type: Date 
  },
  preferredPharmacyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pharmacy' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better query performance
ClientSchema.index({ email: 1 });
ClientSchema.index({ googleId: 1 });

module.exports = mongoose.model('Client', ClientSchema);