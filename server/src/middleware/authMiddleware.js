import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export const isAuthenticated = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authorized to access this route' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true }
      });

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User no longer exists or is inactive' }
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authorized to access this route' }
      });
    }
  } catch (error) {
    next(error);
  }
};

export const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'User role is not authorized to access this route' }
      });
    }
    next();
  };
};
