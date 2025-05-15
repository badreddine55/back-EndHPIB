// models/HistoricDelivery.js
const mongoose = require('mongoose');

const historicDeliverySchema = new mongoose.Schema({
  deliveryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Delivery', 
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier', // Reference to the Supplier model
    required: true
  },
  modifiedAt: { 
    type: Date, 
    required: true 
  },
  modifiedBy: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('HistoricDelivery', historicDeliverySchema);