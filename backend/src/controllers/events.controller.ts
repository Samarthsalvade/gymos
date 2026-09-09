import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listEvents(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const events = await prisma.event.findMany({
    where: { gymId },
    orderBy: { eventDate: 'desc' },
    take: 50,
  });
  res.json(events);
}

export async function createEvent(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { title, description, eventDate, type } = req.body;
  if (!title || !eventDate) { res.status(400).json({ error: 'title and eventDate required' }); return; }
  const event = await prisma.event.create({
    data: { gymId, title, description: String(description || ''), eventDate: new Date(eventDate as string), type: String(type || 'ANNOUNCEMENT'), createdBy: req.user!.userId },
  });
  // Notify all active members
  const members = await prisma.user.findMany({ where: { gymId, role: 'MEMBER', isActive: true }, select: { id: true } });
  await prisma.notification.createMany({
    data: members.map(m => ({
      gymId, userId: m.id, title: `New: ${title}`, message: description || title, type: 'EVENT',
    })),
  });
  res.status(201).json(event);
}

export async function updateEvent(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const ev = await prisma.event.findFirst({ where: { id, gymId } });
  if (!ev) { res.status(404).json({ error: 'Event not found' }); return; }
  const { title, description, eventDate, type } = req.body;
  const updated = await prisma.event.update({
    where: { id },
    data: { title, description, eventDate: eventDate ? new Date(eventDate) : undefined, type },
  });
  res.json(updated);
}

export async function deleteEvent(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const ev = await prisma.event.findFirst({ where: { id, gymId } });
  if (!ev) { res.status(404).json({ error: 'Event not found' }); return; }
  await prisma.event.delete({ where: { id } });
  res.json({ message: 'Deleted' });
}
