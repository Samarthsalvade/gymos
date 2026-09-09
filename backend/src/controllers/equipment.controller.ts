import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listEquipment(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { category, condition } = req.query;
  const where: any = { gymId };
  if (category) where.category = String(category);
  if (condition) where.condition = String(condition);
  const equipment = await prisma.equipment.findMany({ where, orderBy: { category: 'asc' } });
  res.json(equipment);
}

export async function createEquipment(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const { name, category, quantity, condition, purchaseDate, notes } = req.body;
  if (!name || !category) { res.status(400).json({ error: 'name and category required' }); return; }
  const item = await prisma.equipment.create({
    data: { gymId, name, category, quantity: quantity || 1, condition: condition || 'GOOD', purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined, notes },
  });
  res.status(201).json(item);
}

export async function updateEquipment(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const item = await prisma.equipment.findFirst({ where: { id, gymId } });
  if (!item) { res.status(404).json({ error: 'Equipment not found' }); return; }
  const { name, category, quantity, condition, notes } = req.body;
  const updated = await prisma.equipment.update({ where: { id }, data: { name, category, quantity, condition, notes } });
  res.json(updated);
}

export async function deleteEquipment(req: Request, res: Response) {
  const gymId = req.user!.gymId;
  const id = parseInt(req.params.id as string);
  const item = await prisma.equipment.findFirst({ where: { id, gymId } });
  if (!item) { res.status(404).json({ error: 'Equipment not found' }); return; }
  await prisma.equipment.delete({ where: { id } });
  res.json({ message: 'Deleted' });
}
