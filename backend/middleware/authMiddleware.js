import jwt from 'jsonwebtoken';
import User from '../models/Dentist.js';

/**
 * Middleware: verify user JWT and attach req.user
 * Reads token from HttpOnly cookie first, then falls back to Authorization header.
 */
const verifyUser = async (req, res, next) => {
  // Read token from HttpOnly cookie first, then fall back to Authorization header
  let token = req.cookies?.dentzy_jwt;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token && req.query?.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found.' });
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Your account is not approved yet.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

export default verifyUser;

