const Meal = require('../models/Meal');
const Intern = require('../models/Intern');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure Uploads/meals/ directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'meals');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for meal photo storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `meal-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images JPEG, JPG ou PNG sont autorisées'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('mealPhoto');

// Reset mealOptOuts for past days
const resetMealOptOuts = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Intern.updateMany(
      {},
      { $pull: { mealOptOuts: { date: { $lt: today } } } }
    );
    console.log("mealOptOuts reset for past days");
  } catch (error) {
    console.error("Error resetting mealOptOuts:", error);
  }
};

const createMeal = async (req, res) => {
  try {
    const { mealName, type, date, priceOfMeal } = req.body;
    const newMeal = new Meal({
      mealName,
      type,
      date: date || Date.now(),
      priceOfMeal
    });
    const savedMeal = await newMeal.save();
    res.status(201).json({
      success: true,
      data: savedMeal,
      message: 'Meal created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: errors,
        message: 'Validation failed'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Server error while creating meal'
    });
  }
};

const getAllMeals = async (req, res) => {
  try {
    const meals = await Meal.find();
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des repas', error: error.message });
  }
};

const getMealsForNextDay = async (req, res) => {
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

const updateConsommation = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);
  const meals = await Meal.find({ date: { $gte: tomorrow, $lte: endOfTomorrow } });
  const interns = await Intern.find();
  for (const intern of interns) {
    let dailyCost = 0;
    const optOuts = intern.mealOptOuts.find((opt) => new Date(opt.date).toDateString() === tomorrow.toDateString())?.mealTypes || [];
    for (const meal of meals) {
      if (!optOuts.includes(meal.type)) {
        dailyCost += meal.priceOfMeal;
      }
    }
    intern.consommation += dailyCost;
    await intern.save();
  }
};

const confirmTomorrowMeals = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    const meals = await Meal.find({ date: { $gte: tomorrow, $lte: endOfTomorrow } });
    if (meals.length === 0) {
      return res.status(400).json({ message: "Aucun repas prévu pour demain à confirmer" });
    }
    await updateConsommation();
    res.status(200).json({ message: "Repas de demain confirmés et consommation mise à jour" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la confirmation", error: error.message });
  }
};

const unconfirmTomorrowMeals = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    const meals = await Meal.find({ date: { $gte: tomorrow, $lte: endOfTomorrow } });
    if (meals.length === 0) {
      return res.status(400).json({ message: "Aucun repas prévu pour demain à déconfirmer" });
    }
    const interns = await Intern.find();
    for (const intern of interns) {
      let dailyCost = 0;
      const optOuts = intern.mealOptOuts.find((opt) => new Date(opt.date).toDateString() === tomorrow.toDateString())?.mealTypes || [];
      for (const meal of meals) {
        if (!optOuts.includes(meal.type)) {
          dailyCost += meal.priceOfMeal;
        }
      }
      intern.consommation = Math.max(0, intern.consommation - dailyCost);
      await intern.save();
    }
    res.status(200).json({ message: "Repas de demain déconfirmés et consommation ajustée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la déconfirmation", error: error.message });
  }
};

const updateMealOptOuts = async (req, res) => {
  try {
    const { date, mealTypes } = req.body;
    const internId = req.user.id;
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ message: 'Stagiaire non trouvé' });
    }
    const optOutIndex = intern.mealOptOuts.findIndex(
      (opt) => new Date(opt.date).toDateString() === new Date(date).toDateString()
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

const optInMeal = async (req, res) => {
  try {
    const { date, mealType } = req.body;
    const internId = req.user.id;
    if (!date || !mealType) {
      return res.status(400).json({ message: "Date et type de repas sont requis" });
    }
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ message: "Intern non trouvé" });
    }
    const optOutIndex = intern.mealOptOuts.findIndex(
      (opt) => new Date(opt.date).toDateString() === new Date(date).toDateString()
    );
    if (optOutIndex !== -1) {
      intern.mealOptOuts[optOutIndex].mealTypes = intern.mealOptOuts[optOutIndex].mealTypes.filter(
        (type) => type !== mealType
      );
      if (intern.mealOptOuts[optOutIndex].mealTypes.length === 0) {
        intern.mealOptOuts.splice(optOutIndex, 1);
      }
    }
    await intern.save();
    res.status(200).json({ message: "Réinscription au repas réussie" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la réinscription", error: error.message });
  }
};

const getNextDayOptOuts = async (req, res) => {
  try {
    const internId = req.user.id;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({ message: "Intern non trouvé" });
    }
    const optOutForTomorrow = intern.mealOptOuts.find((opt) => {
      const optDate = new Date(opt.date);
      return optDate.toDateString() === tomorrow.toDateString();
    });
    const optedOutMealTypes = optOutForTomorrow ? optOutForTomorrow.mealTypes : [];
    const meals = await Meal.find({
      date: { $gte: tomorrow, $lte: endOfTomorrow },
    });
    const mealsNotBenefiting = meals.filter((meal) => optedOutMealTypes.includes(meal.type));
    res.status(200).json({
      success: true,
      optedOutMeals: mealsNotBenefiting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des repas non bénéficiés",
      error: error.message,
    });
  }
};

const getMeals = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const meals = await Meal.find({
      date: { $gte: startOfWeek, $lte: endOfWeek },
    }).sort('date type');
    if (!meals.length) {
      return res.status(404).json({
        success: false,
        message: 'Repas non trouvé',
        error: 'Aucun repas prévu pour cette semaine.'
      });
    }
    res.status(200).json({
      success: true,
      meals: meals,
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      message: 'Repas de la semaine récupérés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des repas de la semaine',
      error: error.message
    });
  }
};

const updateMeal = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Erreur lors du téléchargement de l\'image',
        });
      }

      const { id } = req.params;
      const { mealName, type, date, priceOfMeal } = req.body;

      if (!id || id.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ID manquant',
          error: 'Aucun ID de repas n’a été fourni.'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID invalide',
          error: `L’ID ${id} n’est pas un ObjectId valide.`
        });
      }

      const objectId = new mongoose.Types.ObjectId(id);
      const updateData = {
        ...(mealName && { mealName }),
        ...(type && { type }),
        ...(date && { date }),
        ...(priceOfMeal && { priceOfMeal }),
      };

      if (req.file) {
        updateData.mealPhoto = `/uploads/meals/${req.file.filename}`;
      }

      const updatedMeal = await Meal.findByIdAndUpdate(
        objectId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedMeal) {
        return res.status(404).json({
          success: false,
          message: 'Repas non trouvé',
          error: `Aucun repas trouvé avec l’ID ${id}.`
        });
      }

      res.status(200).json({
        success: true,
        data: updatedMeal,
        message: 'Repas mis à jour avec succès'
      });
    });
  } catch (error) {
    console.error('Error in updateMeal:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du repas',
      error: error.message || 'Une erreur serveur s’est produite.'
    });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ID manquant',
        error: 'Aucun ID de repas n’a été fourni.'
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide',
        error: `L’ID ${id} n’est pas un ObjectId valide.`
      });
    }
    const objectId = new mongoose.Types.ObjectId(id);
    const deletedMeal = await Meal.findByIdAndDelete(objectId);
    if (!deletedMeal) {
      return res.status(404).json({
        success: false,
        message: 'Repas non trouvé',
        error: `Aucun repas trouvé avec l’ID ${id}.`
      });
    }
    res.status(200).json({
      success: true,
      message: 'Repas supprimé avec succès'
    });
  } catch (error) {
    console.error('Error in deleteMeal:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du repas',
      error: error.message || 'Une erreur serveur s’est produite.'
    });
  }
};

module.exports = {
  getAllMeals,
  getMealsForNextDay,
  createMeal,
  updateConsommation,
  confirmTomorrowMeals,
  unconfirmTomorrowMeals,
  updateMealOptOuts,
  optInMeal,
  getMeals,
  getNextDayOptOuts,
  resetMealOptOuts,
  updateMeal,
  deleteMeal
};