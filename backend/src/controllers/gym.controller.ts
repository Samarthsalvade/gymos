import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getGymSettings(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) { res.status(404).json({ error: 'Gym not found' }); return; }
  res.json(gym);
}

export async function updateGymSettings(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { name, logo, coverImage, accentColor, address, phone, email, website, description, selfCheckInDefault, defaultModules } = req.body;
  const gym = await prisma.gym.update({
    where: { id: gymId },
    data: {
      name, logo, coverImage, accentColor, address, phone, email, website, description,
      ...(selfCheckInDefault !== undefined && { selfCheckInDefault: Boolean(selfCheckInDefault) }),
      ...(defaultModules !== undefined && {
        defaultModules: Array.isArray(defaultModules) ? JSON.stringify(defaultModules) : defaultModules,
      }),
    },
  });
  res.json(gym);
}

export async function getDashboardStats(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [
    totalMembers, activeMembers, todayAttendance, monthlyAttendance,
    activeMemb, expiringMemb, totalRevenue, equipmentCount,
  ] = await Promise.all([
    prisma.user.count({ where: { gymId, role: 'MEMBER' } }),
    prisma.user.count({ where: { gymId, role: 'MEMBER', isActive: true } }),
    prisma.attendance.count({ where: { gymId, checkInTime: { gte: todayStart } } }),
    prisma.attendance.count({ where: { gymId, checkInTime: { gte: monthAgo } } }),
    prisma.membership.count({ where: { gymId, status: 'ACTIVE' } }),
    prisma.membership.count({ where: { gymId, status: 'ACTIVE', endDate: { lte: weekAhead } } }),
    prisma.membership.aggregate({ where: { gymId }, _sum: { price: true } }),
    prisma.equipment.count({ where: { gymId } }),
  ]);

  res.json({
    totalMembers, activeMembers, todayAttendance, monthlyAttendance,
    activeMemberships: activeMemb, expiringThisWeek: expiringMemb,
    totalRevenue: totalRevenue._sum.price || 0, equipmentCount,
  });
}

export async function getLeaderboard(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const counts = await prisma.attendance.groupBy({
    by: ['userId'],
    where: { gymId, checkInTime: { gte: monthAgo } },
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 10,
  });

  const userIds = counts.map(c => c.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, avatar: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const leaderboard = counts.map((c, i) => ({
    rank: i + 1,
    user: userMap[c.userId],
    checkIns: c._count.userId,
  }));
  res.json(leaderboard);
}

export async function getNotifications(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;
  const notifications = await prisma.notification.findMany({
    where: { gymId, userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(notifications);
}

export async function markNotificationRead(req: Request, res: Response) {
  const id = parseInt(req.params.id as string);
  const userId = req.user!.userId;
  const n = await prisma.notification.findFirst({ where: { id, userId } });
  if (!n) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  res.json({ message: 'Marked as read' });
}

export async function getBadges(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = parseInt((req.params.userId || String(req.user!.userId)) as string);
  const badges = await prisma.badge.findMany({ where: { gymId, userId }, orderBy: { earnedAt: 'desc' } });
  res.json(badges);
}

export async function getTrainerSlots(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { trainerId, date } = req.query;
  const where: any = { gymId };
  if (trainerId) where.trainerId = parseInt(trainerId as string);
  if (date) {
    const d = new Date(date as string);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.startTime = { gte: d, lt: next };
  }
  const slots = await prisma.trainerSlot.findMany({
    where,
    include: {
      trainer: { select: { firstName: true, lastName: true } },
      member: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startTime: 'asc' },
  });
  res.json(slots);
}

export async function createTrainerSlot(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { trainerId, startTime, endTime, notes } = req.body;
  const slot = await prisma.trainerSlot.create({
    data: { gymId, trainerId, startTime: new Date(startTime), endTime: new Date(endTime), notes },
  });
  res.status(201).json(slot);
}

export async function bookTrainerSlot(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const slot = await prisma.trainerSlot.findFirst({ where: { id, gymId, status: 'AVAILABLE' } });
  if (!slot) { res.status(404).json({ error: 'Slot not available' }); return; }
  const updated = await prisma.trainerSlot.update({
    where: { id },
    data: { memberId: req.user!.userId, status: 'BOOKED' },
  });
  res.json(updated);
}
