import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getMyLoyalty(req: Request, res: Response) {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });
  const txns = await prisma.loyaltyTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ points: user?.loyaltyPoints ?? 0, transactions: txns });
}

export async function getLoyaltyLeaderboard(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const top = await prisma.user.findMany({
    where: { gymId, role: 'MEMBER', isActive: true },
    orderBy: { loyaltyPoints: 'desc' },
    take: 10,
    select: { id: true, firstName: true, lastName: true, loyaltyPoints: true },
  });
  res.json(top);
}
