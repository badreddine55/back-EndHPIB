const app = require('./app');
const connectDB = require('./config/db');
const seedSuperAdmin = require('./seeders/superAdminSeeder'); // Import Super Admin seeder
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // Wait for MongoDB connection
    await seedSuperAdmin(); // Seed Super Admin
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();