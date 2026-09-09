import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const items = await prisma.announcement.findMany({
    where: {
      gymId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  });
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { title, body, pinned, expiresAt } = req.body;
  if (!title || !body) { res.status(400).json({ error: 'title and body required' }); return; }
  const item = await prisma.announcement.create({
    data: { gymId, title, body, pinned: !!pinned, expiresAt: expiresAt ? new Date(expiresAt) : null },
  });
  res.status(201).json(item);
}

export async function remove(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id);
  await prisma.announcement.deleteMany({ where: { id, gymId } });
  res.json({ message: 'Deleted' });
}
