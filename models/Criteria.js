// models/Criteria.js
const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  points: { type: Number, required: true },
});

const criteriaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cases: [caseSchema], // Array of cases
});

const Criteria = mongoose.model("Criteria", criteriaSchema);

module.exports = Criteria;