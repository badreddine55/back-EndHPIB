const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productController = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // Matches app.js static serving
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
      cb(new Error('Only images are allowed for products'), false);
    }
  }
});

// Routes
router.post('/', upload.single('bon'), productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.single('bon'), productController.updateProduct); // Added upload middleware
router.delete('/:id', productController.deleteProduct);
router.get('/zone/:zoneId', productController.getProductsByZone);
router.put('/add-quantity/:id', upload.single('bon'), productController.addQuantity); // New route

module.exports = router;