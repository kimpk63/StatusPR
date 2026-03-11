const { verifyToken } = require('../utils/jwt');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
}

// resource should be an object with owner_id property
function authorizeOwnerOrManager(resourceGetter) {
  // resourceGetter can be a function that returns Promise or value
  return async (req, res, next) => {
    try {
      const resource =
        typeof resourceGetter === 'function'
          ? await resourceGetter(req)
          : resourceGetter;
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (
        resource.owner_id !== req.user.id &&
        req.user.role !== 'manager'
      ) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { authenticateToken, authorizeRole, authorizeOwnerOrManager };