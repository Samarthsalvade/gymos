import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import prisma from '../utils/prisma';

const ALL_MODULES = ['dashboard','workout','checkin','progress','badges','membership','events'];

function safeUser(u: any) {
  const { passwordHash, ...rest } = u;
  return rest;
}

export async function listMembers(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { search, role, isActive } = req.query;

  const where: any = { gymId };
  if (role) where.role = role as string;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    const s = (search as string).toLowerCase();
    where.OR = [
      { firstName: { contains: s, mode: 'insensitive' } },
      { lastName: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, email: true, username: true, firstName: true, lastName: true,
      phone: true, role: true, isActive: true, avatar: true, photoUrl: true, qrCode: true,
      referralCode: true, createdAt: true, loyaltyPoints: true,
      selfCheckInEnabled: true, enabledModules: true,
      govtIdType: true, govtIdNumber: true,
      profile: { select: { goals: true, fitnessLevel: true, gender: true, currentWeight: true } },
      memberships: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: { planName: true, endDate: true, status: true, price: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}

export async function getMember(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const user = await prisma.user.findFirst({
    where: { id, gymId },
    include: {
      profile: true,
      memberships: { orderBy: { createdAt: 'desc' } },
      attendances: { orderBy: { checkInTime: 'desc' }, take: 30 },
      progressLogs: { orderBy: { logDate: 'desc' }, take: 20 },
    },
  });
  if (!user) { res.status(404).json({ error: 'Member not found' }); return; }
  res.json(safeUser(user));
}

export async function createMember(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const {
    email, firstName, lastName, phone, password, role = 'MEMBER',
    goals, fitnessLevel, injuries, availableDays,
    photoUrl, govtIdType, govtIdNumber,
  } = req.body;

  if (!email || !firstName || !password) {
    res.status(400).json({ error: 'email, firstName, password required' });
    return;
  }
  const existing = await prisma.user.findFirst({ where: { gymId, email: email.toLowerCase() } });
  if (existing) { res.status(409).json({ error: 'Email already registered in this gym' }); return; }

  // Get gym defaults for modules
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  const defaultModules = gym?.defaultModules || JSON.stringify(ALL_MODULES);

  const hash = await bcrypt.hash(password, 12);
  const referralCode = randomUUID().slice(0, 8).toUpperCase();

  const user = await prisma.user.create({
    data: {
      gymId, email: email.toLowerCase(), username: email.toLowerCase(),
      passwordHash: hash, firstName, lastName: lastName || '', phone, role, referralCode,
      photoUrl, govtIdType, govtIdNumber,
      selfCheckInEnabled: gym?.selfCheckInDefault ?? false,
      enabledModules: defaultModules,
      profile: {
        create: {
          goals, fitnessLevel, injuries,
          availableDays: availableDays ? JSON.stringify(availableDays) : null,
        },
      },
    },
    include: { profile: true },
  });

  const qrCode = await QRCode.toDataURL(JSON.stringify({ userId: user.id, gymId }));
  await prisma.user.update({ where: { id: user.id }, data: { qrCode } });

  res.status(201).json(safeUser({ ...user, qrCode }));
}

export async function updateMember(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const {
    firstName, lastName, phone, role, isActive,
    goals, fitnessLevel, injuries, availableDays, height, targetWeight,
    photoUrl, govtIdType, govtIdNumber,
    selfCheckInEnabled, enabledModules,
  } = req.body;

  const user = await prisma.user.findFirst({ where: { id, gymId } });
  if (!user) { res.status(404).json({ error: 'Member not found' }); return; }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(govtIdType !== undefined && { govtIdType }),
      ...(govtIdNumber !== undefined && { govtIdNumber }),
      ...(selfCheckInEnabled !== undefined && { selfCheckInEnabled: Boolean(selfCheckInEnabled) }),
      ...(enabledModules !== undefined && {
        enabledModules: Array.isArray(enabledModules) ? JSON.stringify(enabledModules) : enabledModules,
      }),
      profile: {
        upsert: {
          create: {
            goals, fitnessLevel, injuries, height, targetWeight,
            availableDays: availableDays ? JSON.stringify(availableDays) : undefined,
          },
          update: {
            ...(goals !== undefined && { goals }),
            ...(fitnessLevel !== undefined && { fitnessLevel }),
            ...(injuries !== undefined && { injuries }),
            ...(height !== undefined && { height }),
            ...(targetWeight !== undefined && { targetWeight }),
            ...(availableDays !== undefined && { availableDays: JSON.stringify(availableDays) }),
          },
        },
      },
    },
    include: { profile: true },
  });
  res.json(safeUser(updated));
}

export async function deleteMember(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const user = await prisma.user.findFirst({ where: { id, gymId } });
  if (!user) { res.status(404).json({ error: 'Member not found' }); return; }
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Member deactivated' });
}

export async function getMyProfile(req: Request, res: Response) {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      gym: { select: { name: true, gymCode: true, logo: true, accentColor: true, selfCheckInDefault: true, defaultModules: true } },
      memberships: { where: { status: 'ACTIVE' }, orderBy: { endDate: 'desc' }, take: 1 },
    },
  });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  // Return effective modules (user override or gym default)
  const effectiveModules = user.enabledModules ?? user.gym?.defaultModules ?? JSON.stringify(ALL_MODULES);
  res.json({ ...safeUser(user), effectiveModules: JSON.parse(effectiveModules) });
}

export async function updateMyProfile(req: Request, res: Response) {
  const userId = req.user!.userId;
  const {
    firstName, lastName, phone, photoUrl,
    goals, fitnessLevel, injuries, availableDays, height, targetWeight, currentWeight, gender,
  } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(photoUrl !== undefined && { photoUrl }),
      profile: {
        upsert: {
          create: { goals, fitnessLevel, injuries, height, targetWeight, currentWeight, gender, availableDays: availableDays ? JSON.stringify(availableDays) : undefined },
          update: {
            ...(goals !== undefined && { goals }),
            ...(fitnessLevel !== undefined && { fitnessLevel }),
            ...(injuries !== undefined && { injuries }),
            ...(height !== undefined && { height }),
            ...(targetWeight !== undefined && { targetWeight }),
            ...(currentWeight !== undefined && { currentWeight }),
            ...(gender !== undefined && { gender }),
            ...(availableDays !== undefined && { availableDays: JSON.stringify(availableDays) }),
          },
        },
      },
    },
    include: { profile: true },
  });
  res.json(safeUser(updated));
}

export async function getMemberStats(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = parseInt((req.params.id || String(req.user!.userId)) as string);

  const [totalCheckIns, lastCheckIn, activeMembership, badges] = await Promise.all([
    prisma.attendance.count({ where: { gymId, userId } }),
    prisma.attendance.findFirst({ where: { gymId, userId }, orderBy: { checkInTime: 'desc' } }),
    prisma.membership.findFirst({ where: { gymId, userId, status: 'ACTIVE' }, orderBy: { endDate: 'desc' } }),
    prisma.badge.findMany({ where: { gymId, userId } }),
  ]);

  const recentAttendance = await prisma.attendance.findMany({
    where: { gymId, userId },
    orderBy: { checkInTime: 'desc' },
    take: 400,
  });

  const today = new Date(); today.setHours(0,0,0,0);
  const checkInDays = new Set(recentAttendance.map(a => {
    const d = new Date(a.checkInTime); d.setHours(0,0,0,0); return d.getTime();
  }));

  let currentStreak = 0;
  let d = new Date(today);
  while (checkInDays.has(d.getTime())) { currentStreak++; d.setDate(d.getDate()-1); }

  let streak = 0, maxStreak = 0;
  for (let i = 0; i < 365; i++) {
    const dd = new Date(today); dd.setDate(dd.getDate()-i);
    if (checkInDays.has(dd.getTime())) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  }

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const checkInsThisWeek = recentAttendance.filter(a => new Date(a.checkInTime) >= weekAgo).length;

  res.json({
    totalCheckIns, currentStreak, longestStreak: maxStreak, checkInsThisWeek,
    lastCheckIn: lastCheckIn?.checkInTime, activeMembership, badges,
    daysSinceLastVisit: lastCheckIn
      ? Math.floor((Date.now() - new Date(lastCheckIn.checkInTime).getTime()) / 86400000)
      : null,
  });
}
