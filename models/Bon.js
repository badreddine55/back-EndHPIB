const mongoose = require('mongoose');

const BonSchema = new mongoose.Schema({
  image: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Bon de livraison', 'Bon de sortie'],
    default: 'Bon de livraison'
  },
  DateBon: { type: Date, required: true }, // Renamed from deliveryDateBon
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Optional
  sortieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sortie' }, // Added reference to Sortie
});

module.exports = mongoose.model('Bon', BonSchema);