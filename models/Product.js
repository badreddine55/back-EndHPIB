const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nameProduct: { type: String, required: true },
  priceForOne: { type: Number, required: true },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true },
  unity: { 
    type: String, 
    enum: ['kg', 'g', 'unit', 'liter', 'ml'], 
    default: 'unit' 
  },
  safetyThreshold: Number,
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  expirationDate: { type: Date },
  nameSupplier: [{ type: String }], // Array of supplier names
  bons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bon' }], // Array of references to Bon documents
  numeroBielle: { type: String } // Optional field for connecting rod number
});

module.exports = mongoose.model('Product', ProductSchema);