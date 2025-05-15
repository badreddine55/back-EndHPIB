const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sortieController = require('../controllers/sortieController');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Sortie Routes
router.post('/', upload.single('bon'), sortieController.createSortie); // Changed from 'bonImage' to 'bon'
router.get('/', sortieController.getAllSorties);
router.get('/:id', sortieController.getSortieById);
router.put('/:id', upload.single('bon'), sortieController.updateSortie); // Changed from 'bonImage' to 'bon'
router.delete('/:id', sortieController.deleteSortie);

module.exports = router;