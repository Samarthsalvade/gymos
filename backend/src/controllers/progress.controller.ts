import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getLogs(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.role === 'MEMBER' ? req.user!.userId : parseInt(req.query.userId as string as string || String(req.user!.userId));
  const logs = await prisma.progressLog.findMany({
    where: { gymId, userId },
    orderBy: { logDate: 'desc' },
    take: 50,
  });
  res.json(logs);
}

export async function createLog(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const userId = req.user!.userId;
  const { weight, bodyFat, chestCm, waistCm, hipsCm, armsCm, thighsCm, notes, logDate } = req.body;
  const log = await prisma.progressLog.create({
    data: { gymId, userId, weight, bodyFat, chestCm, waistCm, hipsCm, armsCm, thighsCm, notes, logDate: logDate ? new Date(logDate) : new Date() },
  });
  // Update current weight in profile
  if (weight) {
    await prisma.memberProfile.updateMany({ where: { userId }, data: { currentWeight: weight } });
  }
  res.status(201).json(log);
}

export async function deleteLog(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const log = await prisma.progressLog.findFirst({ where: { id, gymId, userId: req.user!.userId } });
  if (!log) { res.status(404).json({ error: 'Log not found' }); return; }
  await prisma.progressLog.delete({ where: { id } });
  res.json({ message: 'Deleted' });
}
