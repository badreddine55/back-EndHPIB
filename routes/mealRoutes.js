const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const {
  getAllMeals,
  getMealsForNextDay,
  createMeal,
  confirmTomorrowMeals,
  unconfirmTomorrowMeals, // Add this
  updateMealOptOuts,
  optInMeal,
  getMeals,
  getNextDayOptOuts,
  updateMeal, 
  deleteMeal,
} = require('../controllers/mealController');

router.use(protect);

// Routes for Chef
router.get('/', checkRole('Chef'), getAllMeals);

router.get('/week', checkRole('Chef'), getMeals); // Accessible by Chef and Intern
router.get('/next-day', checkRole('Chef', 'intern'), getMealsForNextDay);
router.post('/', checkRole('Chef'), createMeal);
router.post('/confirm-tomorrow', checkRole('Chef'), confirmTomorrowMeals);
router.post('/unconfirm-tomorrow', checkRole('Chef'), unconfirmTomorrowMeals); // New route
router.put('/:id', checkRole('Chef'), updateMeal);
router.delete('/:id', checkRole('Chef'), deleteMeal);
// Routes for Interns
router.post('/opt-out', checkRole('intern'), updateMealOptOuts);
router.post('/opt-in', checkRole('intern'), optInMeal);
router.get('/next-day-opt-outs', checkRole('intern'), getNextDayOptOuts);

module.exports = router;