// controllers/chefController.js
const Chef = require('../models/Chef');
const bcrypt = require('bcrypt');

// Create a new chef
const createChef = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, password, grade } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email || !password || !grade) {
      return res.status(400).json({ message: 'Tous les champs (prénom, nom, téléphone, email, mot de passe, grade) sont requis' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const chef = new Chef({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      grade,
      role: 'Chef' // Explicitly set, though default already ensures this
    });

    const savedChef = await chef.save();
    res.status(201).json(savedChef);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création du chef', error: error.message });
  }
};

// Get all chefs
const getAllChefs = async (req, res) => {
  try {
    const chefs = await Chef.find().select('-password'); // Exclude password
    res.status(200).json(chefs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des chefs', error: error.message });
  }
};

// Get a single chef by ID
const getChefById = async (req, res) => {
  try {
    const chef = await Chef.findById(req.params.id).select('-password');
    if (!chef) {
      return res.status(404).json({ message: 'Chef non trouvé' });
    }
    res.status(200).json(chef);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du chef', error: error.message });
  }
};

// Update a chef
const updateChef = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, grade } = req.body;
    const updateData = { firstName, lastName, phoneNumber, email, grade };
    const chef = await Chef.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!chef) {
      return res.status(404).json({ message: 'Chef non trouvé' });
    }
    res.status(200).json(chef);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour du chef', error: error.message });
  }
};

// Delete a chef
const deleteChef = async (req, res) => {
  try {
    const chef = await Chef.findByIdAndDelete(req.params.id);
    if (!chef) {
      return res.status(404).json({ message: 'Chef non trouvé' });
    }
    res.status(200).json({ message: 'Chef supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du chef', error: error.message });
  }
};

// Reset chef password
const resetChefPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe est requis' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const chef = await Chef.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!chef) {
      return res.status(404).json({ message: 'Chef non trouvé' });
    }

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe', error: error.message });
  }
};

module.exports = {
  createChef,
  getAllChefs,
  getChefById,
  updateChef,
  deleteChef,
  resetChefPassword,
};