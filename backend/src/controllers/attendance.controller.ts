import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Admin scans a member's QR via camera — validates and marks attendance
export async function scanQR(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { qrData } = req.body;
  if (!qrData) { res.status(400).json({ error: 'qrData required' }); return; }

  let parsed: any;
  try { parsed = JSON.parse(qrData); } catch { res.status(400).json({ error: 'Invalid QR data' }); return; }

  if (parsed.gymId !== gymId) {
    res.status(403).json({ error: 'QR does not belong to this gym' }); return;
  }

  // Reuse check-in logic by delegating
  req.body.userId = parsed.userId;
  req.body.qrData = qrData;
  return checkIn(req, res);
}

export async function checkIn(req: Request, res: Response) {
  const { qrData, userId: manualUserId } = req.body;
  const gymId = req.user!.gymId;
  const role = req.user!.role;

  let targetUserId: number;

  if (qrData) {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.gymId !== gymId) {
        res.status(400).json({ error: 'QR code does not belong to this gym' });
        return;
      }
      targetUserId = parsed.userId;
    } catch {
      res.status(400).json({ error: 'Invalid QR data' });
      return;
    }
  } else if (manualUserId) {
    // Admin can mark any user manually
    const isAdmin = ['ADMIN','MANAGER','SUPER_ADMIN','TRAINER'].includes(role);
    if (!isAdmin) { res.status(403).json({ error: 'Only admins can check in other members' }); return; }
    targetUserId = manualUserId;
  } else {
    // Self check-in — validate permission
    const selfUser = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { selfCheckInEnabled: true } });
    if (!selfUser?.selfCheckInEnabled) {
      res.status(403).json({ error: 'Self check-in is not enabled for your account. Show your QR at the front desk.' });
      return;
    }
    targetUserId = req.user!.userId;
  }

  const user = await prisma.user.findFirst({ where: { id: targetUserId, gymId, isActive: true } });
  if (!user) { res.status(404).json({ error: 'Member not found in this gym' }); return; }

  // Prevent duplicate check-in within same day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: {
      gymId, userId: targetUserId,
      checkInTime: { gte: today, lt: tomorrow },
    },
  });
  if (existing) {
    res.status(409).json({ error: 'Already checked in today', attendance: existing });
    return;
  }

  const attendance = await prisma.attendance.create({
    data: { gymId, userId: targetUserId, method: qrData ? 'QR' : 'MANUAL' },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  // Check streak milestones and create badges
  await checkStreakBadges(targetUserId, gymId);

  res.status(201).json(attendance);
}

export async function checkOut(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findFirst({
    where: { gymId, userId, checkInTime: { gte: today }, checkOutTime: null },
    orderBy: { checkInTime: 'desc' },
  });
  if (!attendance) { res.status(404).json({ error: 'No active check-in found' }); return; }

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: { checkOutTime: new Date() },
  });
  res.json(updated);
}

export async function getAttendance(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { date, userId, from, to } = req.query;

  const where: any = { gymId };
  if (userId) where.userId = parseInt(userId as string);
  if (date) {
    const d = new Date(date as string);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.checkInTime = { gte: d, lt: next };
  } else if (from || to) {
    where.checkInTime = {};
    if (from) where.checkInTime.gte = new Date(from as string);
    if (to) where.checkInTime.lte = new Date(to as string);
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { checkInTime: 'desc' },
    take: 500,
  });
  res.json(records);
}

export async function getAttendanceSummary(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [todayCount, weekCount, monthCount, peakHours] = await Promise.all([
    prisma.attendance.count({ where: { gymId, checkInTime: { gte: todayStart } } }),
    prisma.attendance.count({ where: { gymId, checkInTime: { gte: weekAgo } } }),
    prisma.attendance.count({ where: { gymId, checkInTime: { gte: monthAgo } } }),
    prisma.attendance.findMany({
      where: { gymId, checkInTime: { gte: monthAgo } },
      select: { checkInTime: true },
    }),
  ]);

  const hourCounts: Record<number, number> = {};
  peakHours.forEach(a => {
    const h = new Date(a.checkInTime).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });

  const noShowMembers = await prisma.user.findMany({
    where: {
      gymId, role: 'MEMBER', isActive: true,
      memberships: { some: { status: 'ACTIVE' } },
      attendances: { none: { checkInTime: { gte: weekAgo } } },
    },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 20,
  });

  res.json({ todayCount, weekCount, monthCount, hourDistribution: hourCounts, noShowMembers });
}

async function checkStreakBadges(userId: number, gymId: number) {
  const stats = await getStreakCount(userId, gymId);
  const milestones = [7, 30, 100, 365];
  for (const m of milestones) {
    if (stats.currentStreak === m) {
      const exists = await prisma.badge.findFirst({ where: { userId, gymId, name: `${m}-Day Streak` } });
      if (!exists) {
        await prisma.badge.create({
          data: {
            userId, gymId,
            name: `${m}-Day Streak`,
            description: `Checked in for ${m} consecutive days!`,
            icon: m >= 100 ? '🏆' : m >= 30 ? '🥇' : '🔥',
          },
        });
        await prisma.notification.create({
          data: {
            gymId, userId,
            title: `${m}-Day Streak! ${m >= 30 ? '🏆' : '🔥'}`,
            message: `Congratulations! You've achieved a ${m}-day check-in streak!`,
            type: 'BADGE',
          },
        });
      }
    }
  }
}

async function getStreakCount(userId: number, gymId: number) {
  const records = await prisma.attendance.findMany({
    where: { gymId, userId },
    orderBy: { checkInTime: 'desc' },
    take: 365,
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDays = new Set(records.map(a => {
    const d = new Date(a.checkInTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));
  let currentStreak = 0;
  let checkDate = new Date(today);
  while (checkInDays.has(checkDate.getTime())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return { currentStreak };
}

export async function getMyAttendance(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;
  const records = await prisma.attendance.findMany({
    where: { gymId, userId },
    orderBy: { checkInTime: 'desc' },
    take: 90,
  });
  res.json(records);
}
