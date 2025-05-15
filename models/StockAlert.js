const mongoose = require('mongoose');

const StockAlertSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  threshold: Number,
  alertMessage: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockAlert', StockAlertSchema);