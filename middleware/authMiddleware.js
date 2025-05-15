// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Client = require('../models/Client');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Intern = require('../models/Intern');
const Deputydirector = require('../models/Deputydirector');
const Chef = require('../models/Chef'); // Add Chef model import

const googleClient = new OAuth2Client('84784187497-r4iuulv6ucflh4jn438d4sp3e6ujmhdb.apps.googleusercontent.com');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = (await Client.findById(decoded.id)) || 
                 (await Supplier.findById(decoded.id)) || 
                 (await User.findById(decoded.id)) || 
                 (await Intern.findById(decoded.id)) || 
                 (await Deputydirector.findById(decoded.id)) || 
                 (await Chef.findById(decoded.id)); // Add Chef check

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      const headerRole = req.headers.role; // Changed to 'role'
      if (headerRole) {
        req.user.role = headerRole; // Override with 'Role' header
      } else if (decoded.role) {
        req.user.role = decoded.role; // Fallback to JWT role
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } 
  else if (req.headers['x-google-token']) {
    token = req.headers['x-google-token'];
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: '84784187497-r4iuulv6ucflh4jn438d4sp3e6ujmhdb.apps.googleusercontent.com',
      });
      const payload = ticket.getPayload();

      let client = await Client.findOne({ googleId: payload.sub });
      if (!client) {
        client = new Client({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          role: 'client'
        });
        await client.save();
      }

      req.user = {
        id: client._id,
        googleId: client.googleId,
        role: client.role,
        email: client.email
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, Google token failed' });
    }
  } 
  else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const checkRole = (...roles) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }

    // Normalize role to lowercase for consistency
    const userRole = (req.user.role || (req.user.constructor.modelName === 'Intern' ? 'intern' : undefined))?.toLowerCase();
    
    if (!userRole) {
      return res.status(401).json({ message: 'Not authorized, no user role' });
    }

    const allowedRoles = roles.map(role => role.toLowerCase()); // Normalize allowed roles to lowercase

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Accès refusé. Requiert l'un des rôles suivants : ${allowedRoles.join(', ')}`,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { protect, checkRole };