import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: number;
  gymId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ── Token verification ────────────────────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch (err: any) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: msg });
  }
}

// ── Role guard ────────────────────────────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// ── Gym isolation guard ───────────────────────────────────────────────────────
// Prevents a user from accessing another gym's data by manipulating URLs.
// Use on routes that accept a gymId param or query.
export function requireSameGym(req: Request, res: Response, next: NextFunction) {
  const paramGymId = parseInt(req.params.gymId || req.query.gymId as string);
  if (paramGymId && paramGymId !== req.user?.gymId) {
    res.status(403).json({ error: 'Access denied: cross-gym request' });
    return;
  }
  next();
}

// ── Self-or-admin guard ───────────────────────────────────────────────────────
// Prevents members from reading another member's data via userId in URL.
export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction) {
  const paramUserId = parseInt(req.params.id || req.params.userId);
  const { userId, role } = req.user!;
  const isAdmin = ['ADMIN', 'MANAGER', 'SUPER_ADMIN', 'TRAINER'].includes(role);
  if (!isAdmin && paramUserId && paramUserId !== userId) {
    res.status(403).json({ error: 'Access denied: you can only access your own data' });
    return;
  }
  next();
}
