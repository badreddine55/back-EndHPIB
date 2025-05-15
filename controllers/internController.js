const mongoose = require('mongoose');
const Intern = require('../models/Intern');
const Payment = require('../models/Payment');
const bcrypt = require('bcrypt');
const FormerIntern = require('../models/FormerIntern'); 
const Candidate = require('../models/Candidate');
const Meal = require('../models/Meal');
const multer = require('multer');
const path = require('path');
const { ObjectId } = require('mongoose').Types;

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/interns/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images JPEG, JPG ou PNG sont autorisées'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

// Upload profile image for intern
const uploadProfileImage = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Erreur lors du téléchargement de l\'image',
        });
      }

      const internId = req.user.id;
      if (!ObjectId.isValid(internId)) {
        return res.status(400).json({ success: false, message: 'ID invalide' });
      }

      const intern = await Intern.findById(internId);
      if (!intern) {
        return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucune image téléchargée' });
      }

      const imagePath = `/Uploads/interns/${req.file.filename}`;
      intern.image = imagePath;
      await intern.save();

      res.status(200).json({
        success: true,
        message: 'Image de profil téléchargée avec succès',
        image: imagePath,
      });
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    res.status(500).json({
      success: false,
      message: 'Échec du téléchargement de l\'image',
      error: error.message,
    });
  }
};

// Helper function to get the current academic year
const getAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

// Check if an emplacement is already taken
const checkEmplacement = async (req, res) => {
  try {
    const { emplacement } = req.params;
    const intern = await Intern.findOne({ emplacement });
    res.status(200).json({
      success: true,
      taken: !!intern,
    });
  } catch (error) {
    console.error('Error checking emplacement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check emplacement',
      error: error.message,
    });
  }
};

// Create an intern, remove the candidate, and create a payment record
const createInternAndRemoveCandidate = async (req, res) => {
  try {
    const {
      candidateId,
      CFF,
      First_Name,
      Last_Name,
      Gender,
      Nationality,
      Sector,
      hometown,
      email,
      password,
      emplacement,
      phoneNumber,
      parentPhoneNumber,
    } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidat non trouvé' });
    }

    const prefix = Gender === "Male" ? "RB" : "RG";
    const regex = new RegExp(`^${prefix}(1[0-6]|[1-9]),([1-4])$`);
    if (!emplacement || !regex.test(emplacement)) {
      return res.status(400).json({
        success: false,
        message: `Emplacement must be in format ${prefix}[1-16],[1-4] (e.g., ${prefix}5,3)`,
      });
    }

    const existingIntern = await Intern.findOne({ emplacement });
    if (existingIntern) {
      return res.status(400).json({
        success: false,
        message: `Emplacement ${emplacement} is already taken`,
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const intern = new Intern({
      candidateId,
      CFF,
      First_Name,
      Last_Name,
      Gender,
      Nationality,
      Sector,
      hometown,
      email,
      password: hashedPassword,
      emplacement,
      phoneNumber,
      parentPhoneNumber,
    });

    const savedIntern = await intern.save();

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const academicYear = getAcademicYear();

    const payment = new Payment({
      internId: savedIntern._id,
      academicYear,
      payments: { [currentMonth]: 200 },
      totalAmount: 200,
    });
    await payment.save();

    await Candidate.findByIdAndDelete(candidateId);

    res.status(201).json({
      success: true,
      data: savedIntern,
      message: 'Stagiaire créé, paiement enregistré et candidat supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la création du stagiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la création du stagiaire et de la suppression du candidat',
      error: error.message,
    });
  }
};

// Update intern password
const updateInternPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Le mot de passe est requis' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await Intern.updateOne(
      { _id: id },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    }

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la mise à jour du mot de passe',
      error: error.message || 'Erreur interne du serveur',
    });
  }
};

// Delete an intern and associated payments
const deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findById(id);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }

    await Payment.deleteMany({ internId: id });
    await Intern.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Intern and associated payments deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting intern:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete intern',
      error: error.message,
    });
  }
};

// Get all interns
const getAllInterns = async (req, res) => {
  try {
    const interns = await Intern.find();
    res.status(200).json({ success: true, data: interns });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interns',
      error: error.message,
    });
  }
};

// Update intern details
const updateIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      First_Name,
      Last_Name,
      Gender,
      Nationality,
      Sector,
      hometown,
      email,
      emplacement,
      phoneNumber,
      parentPhoneNumber,
    } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    if (emplacement) {
      const prefix = Gender === "Male" ? "RB" : "RG";
      const regex = new RegExp(`^${prefix}(1[0-6]|[1-9]),([1-4])$`);
      if (!regex.test(emplacement)) {
        return res.status(400).json({
          success: false,
          message: `Emplacement must be in format ${prefix}[1-16],[1-4] (e.g., ${prefix}5,3)`,
        });
      }

      const existingIntern = await Intern.findOne({ emplacement, _id: { $ne: id } });
      if (existingIntern) {
        return res.status(400).json({
          success: false,
          message: `Emplacement ${emplacement} is already taken`,
        });
      }
    }

    const updateData = {
      ...(First_Name && { First_Name }),
      ...(Last_Name && { Last_Name }),
      ...(Gender && { Gender }),
      ...(Nationality && { Nationality }),
      ...(Sector && { Sector }),
      ...(hometown && { hometown }),
      ...(email && { email }),
      ...(emplacement && { emplacement }),
      ...(phoneNumber && { phoneNumber }),
      ...(parentPhoneNumber && { parentPhoneNumber }),
    };

    const result = await Intern.updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    }

    res.status(200).json({
      success: true,
      message: 'Stagiaire mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stagiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la mise à jour du stagiaire',
      error: error.message,
    });
  }
};

// Get intern by ID
const getInternById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intern = await Intern.findById(id);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    }

    res.status(200).json({
      success: true,
      data: intern,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du stagiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la récupération du stagiaire',
      error: error.message,
    });
  }
};

// Get current authenticated intern's details
const getCurrentIntern = async (req, res) => {
  try {
    const internId = req.user.id;

    if (!ObjectId.isValid(internId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intern = await Intern.findById(internId).select('-password');
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Stagiaire non trouvé',
      });
    }

    if (req.user.role !== 'intern') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux stagiaires',
      });
    }

    res.status(200).json({
      success: true,
      user: intern,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du stagiaire actuel:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la récupération des données du stagiaire',
      error: error.message,
    });
  }
};

// Optional: If you want interns to check next day's meals
const getNextDayMeals = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      date: { $gte: tomorrow, $lte: endOfTomorrow },
    });
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des repas de demain', error: error.message });
  }
};

// Update meal opt-outs
const updateMealOptOuts = async (req, res) => {
  try {
    const { date, mealTypes } = req.body;
    const internId = req.user.id;

    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ message: 'Stagiaire non trouvé' });
    }

    const Absence = require('../models/Absence');
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const absence = await Absence.findOne({
      internId,
      status: 'approved',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    });

    if (absence) {
      return res.status(403).json({
        message: 'Vous êtes absent ce jour-là et ne pouvez pas modifier vos préférences de repas.',
      });
    }

    const optOutIndex = intern.mealOptOuts.findIndex(
      (opt) => new Date(opt.date).toDateString() === targetDate.toDateString()
    );

    if (optOutIndex === -1) {
      intern.mealOptOuts.push({ date: new Date(date), mealTypes });
    } else {
      intern.mealOptOuts[optOutIndex].mealTypes = [
        ...new Set([...intern.mealOptOuts[optOutIndex].mealTypes, ...mealTypes]),
      ];
    }

    await intern.save();
    res.status(200).json({ message: 'Refus de repas enregistré' });
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de l’enregistrement du refus', error: error.message });
  }
};

// Get total consumption
const getTotalConsumption = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access restricted to Superadmin only' 
      });
    }

    const currentAcademicYear = getAcademicYear();
    const interns = await Intern.find();

    if (!interns || interns.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No interns found' 
      });
    }

    const totalConsumption = interns.reduce((sum, intern) => sum + intern.consommation, 0);

    const stats = {
      totalConsumption: totalConsumption,
      academicYear: currentAcademicYear
    };

    res.status(200).json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    console.error('Error calculating total consumption:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate total consumption',
      error: error.message 
    });
  }
};

// Update consommation
const updateConsommation = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const meals = await Meal.find({ date: { $gte: today, $lte: endOfToday } });
  const interns = await Intern.find();

  for (const intern of interns) {
    let dailyCost = 0;
    const optOuts = intern.mealOptOuts.find(opt => opt.date.toDateString() === today.toDateString())?.mealTypes || [];
    for (const meal of meals) {
      if (!optOuts.includes(meal.type)) {
        dailyCost += meal.priceOfMeal;
      }
    }
    intern.consommation += dailyCost;
    await intern.save();
  }
};

// Calculate total payment for each intern and reset payments
const calculateAndResetPayments = async (req, res) => {
  try {
    const interns = await Intern.find();
    if (!interns || interns.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun stagiaire trouvé' });
    }

    for (const intern of interns) {
      const payment = await Payment.findOne({ internId: intern._id });
      if (payment) {
        const totalPayment = Object.values(payment.payments).reduce((sum, amount) => sum + amount, 0);

        await Intern.updateOne(
          { _id: intern._id },
          { $set: { totalPayment } }
        );

        await Payment.updateOne(
          { internId: intern._id },
          {
            $set: {
              payments: {
                September: 0,
                October: 0,
                November: 0,
                December: 0,
                January: 0,
                February: 0,
                March: 0,
                April: 0,
                May: 0,
                June: 0,
                July: 0,
                August: 0,
              },
              totalAmount: 0,
            },
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Paiements totaux calculés et paiements réinitialisés avec succès pour tous les stagiaires',
    });
  } catch (error) {
    console.error('Erreur lors du calcul et de la réinitialisation des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Échec du calcul et de la réinitialisation des paiements',
      error: error.message,
    });
  }
};
// New controller: Remove intern and save to FormerIntern
const removeInternToFormer = async (req, res) => {
  try {
    const internId = req.params.id;

    // Find the intern
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    }

    // Calculate total payment from Payment collection
    const payment = await Payment.findOne({ intern: internId });
    let totalPayment = intern.totalPayment || 0;
    if (payment) {
      const paymentSum = Object.values(payment.payments).reduce((sum, amount) => sum + amount, 0);
      totalPayment += paymentSum;
    }

    // Create FormerIntern record
    const formerInternData = {
      candidateId: intern.candidateId || null,
      CFF: intern.CFF,
      First_Name: intern.First_Name,
      Last_Name: intern.Last_Name,
      Gender: intern.Gender,
      Nationality: intern.Nationality,
      Sector: intern.Sector,
      hometown: intern.hometown,
      email: intern.email,
      password: intern.password,
      emplacement: intern.emplacement,
      role: intern.role,
      consommation: intern.consommation || 0,
      mealOptOuts: intern.mealOptOuts || [],
      image: intern.image || null,
      phoneNumber: intern.phoneNumber || '',
      parentPhoneNumber: intern.parentPhoneNumber || '',
      totalPayment,
      entryDate: intern.createdAt,
      exitDate: new Date(),
    };

    const formerIntern = new FormerIntern(formerInternData);
    await formerIntern.save();

    // Delete associated Payment record
    if (payment) {
      await Payment.deleteOne({ intern: internId });
    }

    // Delete the intern
    await Intern.deleteOne({ _id: internId });

    res.status(200).json({ success: true, message: 'Stagiaire déplacé vers anciens stagiaires avec succès' });
  } catch (error) {
    console.error('Erreur lors du déplacement du stagiaire:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// New controller: Get all former interns
const getAllFormerInterns = async (req, res) => {
  try {
    const formerInterns = await FormerIntern.find();
    res.status(200).json({ success: true, data: formerInterns || [] });
  } catch (error) {
    console.error('Erreur lors de la récupération des anciens stagiaires:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createInternAndRemoveCandidate,
  getAllInterns,
  deleteIntern,
  updateInternPassword,
  checkEmplacement,
  updateIntern,
  getInternById,
  uploadProfileImage,
  getTotalConsumption,
  calculateAndResetPayments,
  removeInternToFormer,
  getAllFormerInterns,
};