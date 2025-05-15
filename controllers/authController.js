const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Intern = require('../models/Intern');
const Deputydirector = require('../models/Deputydirector');
const Chef = require('../models/Chef'); // Import Chef model
const generateToken = require('../utils/generateToken');

const login = async (req, res) => {
  // Validate request body
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if the user exists in User, Supplier, Intern, Deputydirector, or Chef collections
    let user =
      (await User.findOne({ email })) ||
      (await Supplier.findOne({ email })) ||
      (await Intern.findOne({ email })) ||
      (await Deputydirector.findOne({ email })) ||
      (await Chef.findOne({ email })); // Add Chef check

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password using bcrypt for all user types
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a token for the user
    const token = generateToken(user);

    // Determine the role based on the model
    let role;
    if (user instanceof User) {
      role = user.role || 'user'; // Superadmin or other roles stored in User
    } else if (user instanceof Supplier) {
      role = user.role || 'supplier';
    } else if (user instanceof Intern) {
      role = 'intern';
    } else if (user instanceof Deputydirector) {
      role = 'Deputydirector';
    } else if (user instanceof Chef) {
      role = 'Chef'; // Set role for Chef
    }

    // Send the token and role in the response
    res.json({ token, role });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forget Password for User, Supplier, Intern, Deputydirector, and Chef
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if the user exists in User, Supplier, Intern, Deputydirector, or Chef collections
    let user =
      (await User.findOne({ email })) ||
      (await Supplier.findOne({ email })) ||
      (await Intern.findOne({ email })) ||
      (await Deputydirector.findOne({ email })) ||
      (await Chef.findOne({ email })); // Add Chef check

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Generate a reset token and hash it
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set the reset token and expiration time
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send the password reset email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Réinitialisation du mot de passe',
      text: `Vous recevez ceci car vous (ou quelqu'un d'autre) avez demandé une réinitialisation de mot de passe.\n\n
        Cliquez sur le lien suivant ou collez-le dans votre navigateur pour réinitialiser votre mot de passe :\n\n
        http://${req.headers.host}/api/auth/reset-password/${resetToken}\n\n
        Si vous n'avez pas demandé cela, veuillez ignorer cet e-mail.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'E-mail de réinitialisation de mot de passe envoyé' });
  } catch (error) {
    console.error('Erreur lors de l\'oubli de mot de passe :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Reset Password for User, Supplier, Intern, Deputydirector, and Chef
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user with the matching reset token and check if it's still valid
    let user =
      (await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      })) ||
      (await Supplier.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      })) ||
      (await Intern.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      })) ||
      (await Deputydirector.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      })) ||
      (await Chef.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      })); // Add Chef check

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password for all user types
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get the authenticated user's data
const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const role = req.headers.role;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    switch (role) {
      case 'intern':
        user = await Intern.findById(decoded.id).select('-password');
        break;
      case 'Deputydirector':
        user = await Deputydirector.findById(decoded.id).select('-password');
        break;
      case 'Superadmin':
        user = await User.findById(decoded.id).select('-password');
        break;
      case 'Chef': // Add Chef case
        user = await Chef.findById(decoded.id).select('-password');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Rôle invalide dans l\'en-tête'
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Update the authenticated user's data
const updateMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { firstName, lastName, email, phoneNumber, grade } = req.body;

    // Update fields based on user type
    if (user instanceof Chef) {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.grade = grade || user.grade;
    } else if (user instanceof Intern) {
      const [firstName, ...lastNameParts] = (firstName || '').split(' ');
      user.First_Name = firstName || user.First_Name;
      user.Last_Name = lastNameParts.join(' ') || user.Last_Name;
      user.email = email || user.email;
      user.phoneNumber = phoneNumber || user.phoneNumber;
    } else {
      user.name = firstName || user.name; // For User, Supplier, Deputydirector
      user.email = email || user.email;
      user.phoneNumber = phoneNumber || user.phoneNumber;
    }

    await user.save();

    // Prepare updated user data
    const userData = {
      id: user._id,
      name: user instanceof Chef ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
            user instanceof Intern ? `${user.First_Name || ''} ${user.Last_Name || ''}`.trim() : 
            user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      grade: user instanceof Chef ? user.grade || '' : undefined,
      role: user.role || (user instanceof Chef ? 'Chef' : user instanceof Intern ? 'intern' : 'user'),
      createdAt: user.createdAt || undefined,
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error in updateMe:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  login,
  forgetPassword,
  resetPassword,
  getMe,
  updateMe,
};