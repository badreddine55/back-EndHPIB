const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    CFF: { type: String, required: true, unique: true },
    First_Name: { type: String, required: true },
    Last_Name: { type: String, required: true },
    Gender: { type: String, required: true },
    Nationality: { type: String, required: true },
    Sector: { type: String, required: true },
    Observation: { type: String },
    Note: { type: String },
    hometown: { type: String, required: true },
    school_criteria: { type: String },
    family_criteria: { type: String },
    social_criteria: { type: String },
    physical_criteria: { type: String },
    geographic_criteria: { type: String },
    status: { type: String, default: "candidate" },
    phoneNumber: { type: String }, // Added phoneNumber field
    parentPhoneNumber: { type: String }, // Added parentPhoneNumber field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);