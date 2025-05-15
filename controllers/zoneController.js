// controllers/zoneController.js
const Zone = require('../models/Zone');

// @desc    Get all zones
// @route   GET /api/zones
// @access  Private (Superadmin, Deputydirector)
const getAllZones = async (req, res) => {
  try {
    if (!['Superadmin', 'Deputydirector','Chef'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé : Réservé au Superadmin et Deputy Director' });
    }

    const zones = await Zone.find();
    res.json(zones);
  } catch (error) {
    console.error('Erreur lors de la récupération des zones:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Create a new zone
// @route   POST /api/zones
// @access  Private (Superadmin)
const createZone = async (req, res) => {
  try {
    if (req.user.role !== 'Deputydirector') {
      return res.status(403).json({ message: 'Accès refusé : Réservé au Superadmin' });
    }

    const { zoneName } = req.body;
    if (!zoneName) {
      return res.status(400).json({ message: 'Le nom de la zone est requis' });
    }

    const zone = new Zone({ zoneName });
    await zone.save();
    res.status(201).json(zone);
  } catch (error) {
    console.error('Erreur lors de la création de la zone:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Update a zone
// @route   PUT /api/zones/:id
// @access  Private (Superadmin)
const updateZone = async (req, res) => {
  try {
    if (req.user.role !== 'Deputydirector') {
      return res.status(403).json({ message: 'Accès refusé : Réservé au Superadmin' });
    }

    const { zoneName } = req.body;
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: 'Zone non trouvée' });
    }

    zone.zoneName = zoneName || zone.zoneName;
    await zone.save();
    res.json(zone);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la zone:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Delete a zone
// @route   DELETE /api/zones/:id
// @access  Private (Superadmin)
const deleteZone = async (req, res) => {
  try {
    if (req.user.role !== 'Deputydirector') {
      return res.status(403).json({ message: 'Accès refusé : Réservé au Superadmin' });
    }

    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: 'Zone non trouvée' });
    }

    await zone.deleteOne();
    res.json({ message: 'Zone supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la zone:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  getAllZones,
  createZone,
  updateZone,
  deleteZone
};