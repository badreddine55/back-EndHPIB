// controllers/deputydirectorController.js
const Deputydirector = require('../models/Deputydirector');
const bcrypt = require('bcryptjs');

// @desc    Create a new deputydirector
// @route   POST /api/deputydirectors
// @access  Private (Superadmin only)
const createDeputydirector = async (req, res) => {
  const { name, email, password, phoneNumber, address, dateOfBirth } = req.body;

  try {
    const deputydirectorExists = await Deputydirector.findOne({ email });
    if (deputydirectorExists) {
      return res.status(400).json({ message: 'Un Gestionnaire dhôtel avec cet email existe déjà' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const deputydirector = await Deputydirector.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      dateOfBirth,
    });

    res.status(201).json({
      _id: deputydirector._id,
      name: deputydirector.name,
      email: deputydirector.email,
      phoneNumber: deputydirector.phoneNumber,
      address: deputydirector.address,
      dateOfBirth: deputydirector.dateOfBirth,
      role: deputydirector.role,
    });
  } catch (error) {
    console.error('Erreur lors de la création du Gestionnaire dhôtel:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Get all deputydirectors
// @route   GET /api/deputydirectors
// @access  Private (Superadmin only)
const getAllDeputydirectors = async (req, res) => {
  try {
    const deputydirectors = await Deputydirector.find().select('-password');
    res.json(deputydirectors);
  } catch (error) {
    console.error('Erreur lors de la récupération des Gestionnaire dhôtel:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Get a single deputydirector by ID
// @route   GET /api/deputydirectors/:id
// @access  Private (Superadmin or Deputydirector)
const getDeputydirectorById = async (req, res) => {
  try {
    const deputydirector = await Deputydirector.findById(req.params.id).select('-password');
    if (!deputydirector) {
      return res.status(404).json({ message: 'Gestionnaire dhôtel non trouvé' });
    }
    res.json(deputydirector);
  } catch (error) {
    console.error('Erreur lors de la récupération du Gestionnaire dhôtel:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Update a deputydirector
// @route   PUT /api/deputydirectors/:id
// @access  Private (Superadmin or Deputydirector)
const updateDeputydirector = async (req, res) => {
  const { name, email, password, phoneNumber, address, dateOfBirth } = req.body;

  try {
    const deputydirector = await Deputydirector.findById(req.params.id);
    if (!deputydirector) {
      return res.status(404).json({ message: 'Gestionnaire dhôtel non trouvé' });
    }

    deputydirector.name = name || deputydirector.name;
    deputydirector.email = email || deputydirector.email;
    deputydirector.phoneNumber = phoneNumber || deputydirector.phoneNumber;
    deputydirector.address = address || deputydirector.address;
    deputydirector.dateOfBirth = dateOfBirth || deputydirector.dateOfBirth;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      deputydirector.password = await bcrypt.hash(password, salt);
    }

    const updatedDeputydirector = await deputydirector.save();
    res.json({
      _id: updatedDeputydirector._id,
      name: updatedDeputydirector.name,
      email: updatedDeputydirector.email,
      phoneNumber: updatedDeputydirector.phoneNumber,
      address: updatedDeputydirector.address,
      dateOfBirth: updatedDeputydirector.dateOfBirth,
      role: updatedDeputydirector.role,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du Gestionnaire dhôtel:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Delete a deputydirector
// @route   DELETE /api/deputydirectors/:id
// @access  Private (Superadmin only)
const deleteDeputydirector = async (req, res) => {
  try {
    const deputydirector = await Deputydirector.findById(req.params.id);
    if (!deputydirector) {
      return res.status(404).json({ message: 'Gestionnaire dhôtel non trouvé' });
    }

    await deputydirector.remove();
    res.json({ message: 'Gestionnaire dhôtel supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du Gestionnaire dhôtel:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createDeputydirector,
  getAllDeputydirectors,
  getDeputydirectorById,
  updateDeputydirector,
  deleteDeputydirector,
};