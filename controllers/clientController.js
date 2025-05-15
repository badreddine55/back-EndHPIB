// controllers/clientController.js
const Client = require("../models/client");
const Message = require("../models/message");
const Nurse = require("../models/Nurse");

// @desc    Get logged-in client's information
// @route   GET /api/clients/me
// @access  Private
const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.user.id); // Use _id from protect middleware

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({
      _id: client._id,
      email: client.email,
      name: client.name,
      role: client.role,
      phoneNumber: client.phoneNumber,
      address: client.address,
      dateOfBirth: client.dateOfBirth,
      preferredPharmacyId: client.preferredPharmacyId,
      createdAt: client.createdAt,
    });
  } catch (error) {
    console.error("Error fetching client:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get messages between client and nurse
// @route   GET /api/clients/messages/:nurseId
// @access  Private
const getClientMessages = async (req, res) => {
  try {
    const { nurseId } = req.params;
    const userId = req.user.id; // Client's MongoDB _id from protect middleware

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: nurseId },
        { sender: nurseId, receiver: userId },
      ],
    }).sort("createdAt");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getClientMessages:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Send a message to a nurse
// @route   POST /api/clients/messages
// @access  Private
const sendClientMessage = async (req, res) => {
  try {
    const { nurseId, content } = req.body;
    const userId = req.user.id; // Client's MongoDB _id from protect middleware

    if (!nurseId || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const nurse = await Nurse.findById(nurseId);
    if (!nurse) {
      return res.status(404).json({ message: "Nurse not found" });
    }

    const message = new Message({
      sender: userId,
      receiver: nurseId,
      senderModel: "Client",
      receiverModel: "Nurse",
      content,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error("Error in sendClientMessage:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getClient, getClientMessages, sendClientMessage };