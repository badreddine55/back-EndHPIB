const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  expiry: Date,
  ipAddress: String,
  isActive: Boolean,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Session', SessionSchema);