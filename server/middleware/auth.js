const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  // Try Authorization header first
  let token = null;
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  // Fall back to httpOnly cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};