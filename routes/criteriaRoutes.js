// routes/criteriaRoutes.js
const express = require("express");
const router = express.Router();
const { protect, checkRole } = require("../middleware/authMiddleware"); // Import your auth middleware
const {
  getAllCriteria,
  getCriterionById,
  createCriterion,
  updateCriterion,
  deleteCriterion,
} = require("../controllers/criteriaController");

// Restrict all routes to Deputydirector only
router.use(protect); // Ensure user is authenticated
router.use(checkRole("Deputydirector")); // Restrict to Deputydirector role

// CRUD Routes
router.post("/", createCriterion); // Create a new criterion
router.get("/", getAllCriteria); // Get all criteria
router.get("/:id", getCriterionById); // Get a criterion by ID
router.put("/:id", updateCriterion); // Update a criterion by ID
router.delete("/:id", deleteCriterion); // Delete a criterion by ID

module.exports = router;