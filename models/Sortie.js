const mongoose = require('mongoose');

const SortieSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  chefName: { type: String, default: "" },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0 },
    productName: { type: String, required: true },
  }],
  bonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bon' },
});

module.exports = mongoose.model('Sortie', SortieSchema);