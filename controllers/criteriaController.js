const Criteria = require("../models/Criteria");

// Get all criteria
const getAllCriteria = async (req, res) => {
  try {
    const criteria = await Criteria.find();
    res.status(200).json(criteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single criterion by ID
const getCriterionById = async (req, res) => {
  try {
    const criterion = await Criteria.findById(req.params.id);
    if (!criterion) {
      return res.status(404).json({ message: "Criterion not found" });
    }
    res.status(200).json(criterion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new criterion
const createCriterion = async (req, res) => {
  try {
    const { name, cases } = req.body;
    const newCriterion = new Criteria({ name, cases });
    await newCriterion.save();
    res.status(201).json(newCriterion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a criterion by ID
const updateCriterion = async (req, res) => {
  try {
    const { name, cases } = req.body;
    const updatedCriterion = await Criteria.findByIdAndUpdate(
      req.params.id,
      { name, cases },
      { new: true } // Return the updated document
    );
    if (!updatedCriterion) {
      return res.status(404).json({ message: "Criterion not found" });
    }
    res.status(200).json(updatedCriterion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a criterion by ID
const deleteCriterion = async (req, res) => {
  try {
    const deletedCriterion = await Criteria.findByIdAndDelete(req.params.id);
    if (!deletedCriterion) {
      return res.status(404).json({ message: "Criterion not found" });
    }
    res.status(200).json({ message: "Criterion deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCriteria,
  getCriterionById,
  createCriterion,
  updateCriterion,
  deleteCriterion,
};