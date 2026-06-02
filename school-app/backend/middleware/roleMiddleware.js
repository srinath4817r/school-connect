// Middleware to restrict access based on user roles
const authorize = (allowedRoles = []) => {
  // If allowedRoles is passed as a string, convert to array
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  // Principal has the exact same permissions as school_admin
  if (allowedRoles.includes('school_admin') && !allowedRoles.includes('principal')) {
    allowedRoles.push('principal');
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }

    // Super Admin has all permissions everywhere
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource` 
      });
    }

    next();
  };
};

module.exports = { authorize };
