const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path as needed
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    // Check if Super Admin already exists
    const superAdminExists = await User.findOne({ email: 'Superadmin@gmail.com' });
    if (superAdminExists) {
      console.log('Super Admin already exists');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);

    // Create the Super Admin
    await User.create({
      name: 'Super Admin',
      email: 'Superadmin@gmail.com',
      password: hashedPassword,
      phoneNumber: '+212701708363',
      address: '123 Super Admin Street',
      dateOfBirth: new Date('2004-09-17'),
      role: 'Superadmin',
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    console.log('Super Admin seeded successfully');
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

module.exports = seedSuperAdmin;