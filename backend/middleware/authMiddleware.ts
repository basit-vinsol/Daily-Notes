import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/generateToken.ts';
import { getDB } from '../config/db.ts';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      const db = getDB();
      const [rows]: any = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
      req.user = rows[0];

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is blocked
      if (req.user.status === 'blocked') {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware - check if user is admin
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};