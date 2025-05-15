const mongoose = require('mongoose');

const ArticleTakenSchema = new mongoose.Schema({
  productName: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantityTaken: Number,
  takenAt: Date,
  notes: String
});

module.exports = mongoose.model('ArticleTaken', ArticleTakenSchema);