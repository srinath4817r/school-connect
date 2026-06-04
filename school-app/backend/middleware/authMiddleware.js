const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if authorization header is present and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here');

      // Fetch user from database and attach to request (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Not authorized, user not found' });
      }

      // Check token version to support logging out of all devices
      const tokenVersion = decoded.tokenVersion || 0;
      const userVersion = req.user.tokenVersion || 0;
      if (tokenVersion < userVersion) {
        return res.status(401).json({ status: 'error', message: 'Session expired, please login again.' });
      }

      // Check if user is locked
      if (req.user.isLocked()) {
        return res.status(403).json({ status: 'error', message: 'Account is temporarily locked. Access denied.' });
      }

      next();
    } catch (error) {
      console.error(`Token authentication error: ${error.message}`);
      return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
