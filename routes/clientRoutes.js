// routes/client.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getClient,
  getClientMessages,
  sendClientMessage,
} = require("../controllers/clientController");

// Fetch client information based on Google token
router.get("/me", protect, getClient);

// Fetch messages between client and a specific nurse
router.get("/messages/:nurseId", protect, getClientMessages);

// Send a message to a nurse
router.post("/messages", protect, sendClientMessage);

module.exports = router;