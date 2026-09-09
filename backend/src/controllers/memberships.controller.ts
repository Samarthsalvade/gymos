import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Predefined membership plans
export const MEMBERSHIP_PLANS = [
  { name: 'Monthly', days: 30, price: 1499 },
  { name: 'Quarterly', days: 90, price: 3999 },
  { name: 'Semi-Annual', days: 180, price: 6999 },
  { name: 'Annual', days: 365, price: 11999 },
  { name: 'Student Monthly', days: 30, price: 999 },
  { name: 'Student Quarterly', days: 90, price: 2499 },
  { name: 'Couple Monthly', days: 30, price: 2499 },
  { name: 'Couple Quarterly', days: 90, price: 6499 },
  { name: 'Premium Monthly', days: 30, price: 2999 },
  { name: 'Premium Annual', days: 365, price: 24999 },
];

export async function getPlans(_req: Request, res: Response) {
  res.json(MEMBERSHIP_PLANS);
}

export async function listMemberships(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { status, userId } = req.query;
  const where: any = { gymId };
  if (status) where.status = status;
  if (userId) where.userId = parseInt(userId as string);

  const memberships = await prisma.membership.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { endDate: 'asc' },
  });
  res.json(memberships);
}

// Member can see their own memberships
export async function getMyMemberships(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;
  const memberships = await prisma.membership.findMany({
    where: { gymId, userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(memberships);
}

export async function createMembership(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { userId, planName, price, startDate, endDate, paymentMethod, notes } = req.body;
  if (!userId || !planName || !price || !startDate || !endDate) {
    res.status(400).json({ error: 'Missing required fields' }); return;
  }
  const user = await prisma.user.findFirst({ where: { id: userId, gymId } });
  if (!user) { res.status(404).json({ error: 'Member not found' }); return; }

  // Cancel any existing active membership
  await prisma.membership.updateMany({
    where: { gymId, userId, status: 'ACTIVE' },
    data: { status: 'CANCELLED' },
  });

  const membership = await prisma.membership.create({
    data: {
      gymId, userId, planName, price: parseFloat(price),
      startDate: new Date(startDate), endDate: new Date(endDate),
      paymentMethod, notes, status: 'ACTIVE',
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  const daysLeft = Math.floor((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (daysLeft <= 7) {
    await prisma.notification.create({
      data: {
        gymId, userId,
        title: 'Membership Expiring Soon',
        message: `Your "${planName}" membership expires in ${daysLeft} days. Please renew.`,
        type: 'RENEWAL',
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        gymId, userId,
        title: 'Membership Activated',
        message: `Your "${planName}" membership is now active until ${new Date(endDate).toLocaleDateString('en-IN')}.`,
        type: 'INFO',
      },
    });
  }

  res.status(201).json(membership);
}

export async function updateMembership(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const m = await prisma.membership.findFirst({ where: { id, gymId } });
  if (!m) { res.status(404).json({ error: 'Membership not found' }); return; }
  const { planName, price, startDate, endDate, status, paymentMethod, notes } = req.body;
  const updated = await prisma.membership.update({
    where: { id },
    data: {
      planName, price: price ? parseFloat(price) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status, paymentMethod, notes,
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  res.json(updated);
}

export async function renewMembership(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const existing = await prisma.membership.findFirst({
    where: { id, gymId },
    include: { user: true },
  });
  if (!existing) { res.status(404).json({ error: 'Membership not found' }); return; }

  const { planName, price, paymentMethod, notes } = req.body;
  const usePlan = planName || existing.planName;
  const usePrice = price ? parseFloat(price) : existing.price;

  // Find matching plan days
  const planDef = MEMBERSHIP_PLANS.find(p => p.name === usePlan);
  const daysToAdd = planDef?.days || Math.round((new Date(existing.endDate).getTime() - new Date(existing.startDate).getTime()) / 86400000);

  // Start from today or when current membership ends (whichever is later)
  const startFrom = existing.status === 'ACTIVE' && new Date(existing.endDate) > new Date()
    ? new Date(existing.endDate)
    : new Date();
  const endDate = new Date(startFrom.getTime() + daysToAdd * 86400000);

  const renewed = await prisma.membership.create({
    data: {
      gymId, userId: existing.userId,
      planName: usePlan, price: usePrice,
      startDate: startFrom, endDate,
      paymentMethod: paymentMethod || existing.paymentMethod || 'Cash',
      notes: notes || `Renewal of membership #${existing.id}`,
      status: 'ACTIVE',
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  await prisma.notification.create({
    data: {
      gymId, userId: existing.userId,
      title: 'Membership Renewed',
      message: `Your "${usePlan}" membership has been renewed until ${endDate.toLocaleDateString('en-IN')}.`,
      type: 'INFO',
    },
  });

  res.status(201).json(renewed);
}

export async function refundMembership(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const membership = await prisma.membership.findFirst({
    where: { id, gymId },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!membership) { res.status(404).json({ error: 'Membership not found' }); return; }

  const { refundAmount, refundReason, refundMethod } = req.body;

  // Calculate default refund: days remaining / total days * price
  const totalDays = Math.round((new Date(membership.endDate).getTime() - new Date(membership.startDate).getTime()) / 86400000);
  const daysUsed = Math.max(0, Math.round((Date.now() - new Date(membership.startDate).getTime()) / 86400000));
  const daysRemaining = Math.max(0, totalDays - daysUsed);
  const defaultRefund = Math.round((daysRemaining / totalDays) * membership.price);
  const actualRefund = refundAmount !== undefined ? parseFloat(refundAmount) : defaultRefund;

  // Mark membership as cancelled
  await prisma.membership.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: `${membership.notes || ''} | Refund: ₹${actualRefund} via ${refundMethod || 'Cash'} — ${refundReason || 'Member request'}`,
    },
  });

  await prisma.notification.create({
    data: {
      gymId, userId: membership.userId,
      title: 'Membership Refund Processed',
      message: `A refund of ₹${actualRefund} for your "${membership.planName}" membership has been processed via ${refundMethod || 'Cash'}.`,
      type: 'INFO',
    },
  });

  res.json({
    message: 'Refund processed successfully',
    refundAmount: actualRefund,
    daysRemaining,
    defaultRefund,
    membership,
  });
}

export async function getExpiringMemberships(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const days = parseInt(req.query.days as string || '7');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const memberships = await prisma.membership.findMany({
    where: { gymId, status: 'ACTIVE', endDate: { lte: cutoff } },
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
    orderBy: { endDate: 'asc' },
  });
  res.json(memberships);
}

export async function getRevenueReport(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { from, to } = req.query;
  const where: any = { gymId };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }
  const memberships = await prisma.membership.findMany({ where, select: { price: true, planName: true, createdAt: true, status: true } });
  const totalRevenue = memberships.reduce((sum, m) => sum + m.price, 0);
  const byPlan = memberships.reduce((acc: Record<string, number>, m) => {
    acc[m.planName] = (acc[m.planName] || 0) + m.price;
    return acc;
  }, {});
  const activeCount = await prisma.membership.count({ where: { gymId, status: 'ACTIVE' } });
  const expiredCount = await prisma.membership.count({ where: { gymId, status: 'EXPIRED' } });
  res.json({ totalRevenue, byPlan, totalMemberships: memberships.length, activeCount, expiredCount });
}

export async function getChurnRisk(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const atRisk = await prisma.user.findMany({
    where: {
      gymId, role: 'MEMBER', isActive: true,
      memberships: { some: { status: 'ACTIVE' } },
      attendances: { none: { checkInTime: { gte: twoWeeksAgo } } },
    },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      memberships: { where: { status: 'ACTIVE' }, select: { endDate: true, planName: true } },
      attendances: { orderBy: { checkInTime: 'desc' }, take: 1, select: { checkInTime: true } },
    },
  });
  res.json(atRisk);
}
