const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
  products: String,
  suppliers: String,
  totalAmount: Number,
  numberProduct: Number,
  receivedAt: Date,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  suppliersId: { type: mongoose.Schema.Types.ObjectId, ref: 'Suppliers' }
});

module.exports = mongoose.model('Receipt', ReceiptSchema);