const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  zoneName: String,
});

module.exports = mongoose.model('Zone', ZoneSchema);