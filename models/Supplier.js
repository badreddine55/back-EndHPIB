// models/Supplier.js
const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'], 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'], 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    required: [true, 'Phone number is required'], 
    trim: true 
  },
  role: { 
    type: String, 
    default: 'Supplier', 
    enum: ['Supplier']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', SupplierSchema);