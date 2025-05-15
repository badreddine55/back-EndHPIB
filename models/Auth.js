const mongoose = require('mongoose');

const AuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  id_person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
});

module.exports = mongoose.model('Auth', AuthSchema);