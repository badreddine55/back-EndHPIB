const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const criteriaRoutes = require('./routes/criteriaRoutes');
const InternRoutes = require('./routes/InternRoutes');
const FormerInternRoutes = require('./routes/formerInternRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const deputydirectorRoutes = require('./routes/deputydirectorRoutes');
const productRoutes = require('./routes/productRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const chefRoutes = require('./routes/chefRoutes');
const sortieRoutes = require('./routes/sortieRoutes');
const mealRoutes = require('./routes/mealRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { resetMealOptOuts } = require('./controllers/mealController');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
console.log('MONGO_URI:', process.env.MONGO_URI);

const app = express();

// CORS setup
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-google-token', 'Role', 'x-user-role'],
  credentials: true,
}));
app.options('*', cors());

const cron = require('node-cron');
cron.schedule('0 0 * * *', resetMealOptOuts);

// Body parsing (before routes)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/interns', InternRoutes);
app.use('/api/former-interns', FormerInternRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/absence', absenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/deputydirectors', deputydirectorRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/sorties', sortieRoutes);
app.use(errorHandler);

module.exports = app;