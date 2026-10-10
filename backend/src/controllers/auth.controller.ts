import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import prisma from '../utils/prisma';

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_LOCKOUT_ATTEMPTS || '5');
const LOCKOUT_MS = parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '2') * 60 * 1000;

// ── Token helpers ─────────────────────────────────────────────────────────────
function signAccess(userId: number, gymId: number, role: string) {
  return jwt.sign({ userId, gymId, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });
}

async function issueRefreshToken(userId: number, gymId: number, role: string) {
  const token = jwt.sign({ userId, gymId, role }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  // Persist refresh token in DB for secure revocation
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  return token;
}

function buildUserPayload(user: any, gym: any) {
  // Resolve effective modules: user override → gym default → all modules
  const ALL_MODULES = ['dashboard','workout','checkin','progress','badges','membership','events'];
  let effectiveModules: string[];
  try {
    const raw = user.enabledModules ?? gym.defaultModules;
    effectiveModules = raw ? JSON.parse(raw) : ALL_MODULES;
  } catch {
    effectiveModules = ALL_MODULES;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    gymId: gym.id,
    gymCode: gym.gymCode,
    gymName: gym.name,
    gymLogo: gym.logo,
    accentColor: gym.accentColor,
    qrCode: user.qrCode,
    loyaltyPoints: user.loyaltyPoints ?? 0,
    photoUrl: user.photoUrl ?? null,
    selfCheckInEnabled: user.selfCheckInEnabled ?? false,
    enabledModules: effectiveModules,  // always an array
  };
}

// ── Login (with lockout) ───────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password, gymCode } = req.body;
  if (!email || !password || !gymCode) {
    res.status(400).json({ error: 'email, password and gymCode are required' });
    return;
  }

  const gym = await prisma.gym.findUnique({
    where: { gymCode: gymCode.toUpperCase() },
    select: { id: true, gymCode: true, name: true, logo: true, accentColor: true, defaultModules: true, selfCheckInDefault: true },
  });
  if (!gym) { res.status(401).json({ error: 'Invalid gym code' }); return; }

  const user = await prisma.user.findFirst({
    where: { gymId: gym.id, email: email.toLowerCase(), isActive: true },
  });

  if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  // ── Lockout check ────────────────────────────────────────────────────────
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const secsLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
    res.status(429).json({
      error: `Account locked. Try again in ${secsLeft}s.`,
      lockedUntil: user.lockedUntil,
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.loginAttempts + 1;
    const shouldLock = attempts >= MAX_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    });
    const remaining = MAX_ATTEMPTS - attempts;
    res.status(401).json({
      error: shouldLock
        ? `Too many failed attempts. Account locked for ${process.env.LOGIN_LOCKOUT_MINUTES || 2} minutes.`
        : `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`,
    });
    return;
  }

  // Reset on success
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const access = signAccess(user.id, gym.id, user.role);
  const refresh = await issueRefreshToken(user.id, gym.id, user.role);

  res.json({ tokens: { access, refresh }, user: buildUserPayload(user, gym) });
}

// ── Token refresh (validates against DB) ─────────────────────────────────────
export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ error: 'refreshToken required' }); return; }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: number; gymId: number; role: string;
    };

    // Verify token exists in DB and is not revoked
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token invalid or expired' });
      return;
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const newAccess = signAccess(payload.userId, payload.gymId, payload.role);
    const newRefresh = await issueRefreshToken(payload.userId, payload.gymId, payload.role);

    res.json({ tokens: { access: newAccess, refresh: newRefresh } });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// ── Logout (revoke refresh token) ─────────────────────────────────────────────
export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  res.json({ message: 'Logged out' });
}

// ── Register gym ──────────────────────────────────────────────────────────────
export async function registerGym(req: Request, res: Response) {
  const { gymCode, gymName, adminEmail, adminPassword, adminFirstName, adminLastName } = req.body;
  if (!gymCode || !gymName || !adminEmail || !adminPassword) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const existing = await prisma.gym.findUnique({ where: { gymCode: gymCode.toUpperCase() } });
  if (existing) { res.status(409).json({ error: 'Gym code already taken' }); return; }

  const hash = await bcrypt.hash(adminPassword, 12);
  const referralCode = randomUUID().slice(0, 8).toUpperCase();

  const gym = await prisma.gym.create({
    data: {
      gymCode: gymCode.toUpperCase(),
      name: gymName,
      users: {
        create: {
          email: adminEmail.toLowerCase(),
          username: adminEmail.toLowerCase(),
          passwordHash: hash,
          role: 'ADMIN',
          firstName: adminFirstName || 'Admin',
          lastName: adminLastName || '',
          referralCode,
        },
      },
    },
    include: { users: true },
  });

  const admin = gym.users[0];
  const qrCode = await QRCode.toDataURL(JSON.stringify({ userId: admin.id, gymId: gym.id }));
  await prisma.user.update({ where: { id: admin.id }, data: { qrCode } });

  const access = signAccess(admin.id, gym.id, 'ADMIN');
  const refresh = await issueRefreshToken(admin.id, gym.id, 'ADMIN');

  res.status(201).json({
    tokens: { access, refresh },
    user: buildUserPayload({ ...admin, qrCode, loyaltyPoints: 0 }, gym),
  });
}

// ── Change password ───────────────────────────────────────────────────────────
export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: 'Current password incorrect' });
    return;
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  // Revoke all refresh tokens on password change
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  res.json({ message: 'Password updated. Please log in again.' });
}
