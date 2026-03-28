import { Request, Response, NextFunction } from 'express';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(requiredRoles?: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = await getToken({ 
        req: req as any, 
        secret: NEXTAUTH_SECRET 
      });

      let decodedId = token?.id as string | undefined;

      if (!decodedId) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'No token provided' });
        }
        
        try {
          const customToken = authHeader.split(' ')[1];
          const decoded = jwt.verify(customToken, NEXTAUTH_SECRET) as { userId?: string, id?: string };
          decodedId = decoded.userId || decoded.id;
        } catch (e) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }

      if (!decodedId) {
        return res.status(401).json({ error: 'Invalid token structure' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decodedId },
        select: { id: true, email: true, role: true, organizationId: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as { userId: string };
    prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, organizationId: true },
    }).then((user: { id: string; email: string; role: string; organizationId: string | null } | null) => {
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        };
      }
      next();
    });
  } catch {
    next();
  }
}
