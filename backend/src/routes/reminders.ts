import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { completed, dueBefore, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (completed !== undefined) where.completed = completed === 'true';
  if (dueBefore) where.dueDate = { lte: new Date(dueBefore as string) };

  const [reminders, total] = await Promise.all([
    prisma.reminder.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { dueDate: 'asc' },
      include: { loan: { select: { accountNo: true, memberName: true } } },
    }),
    prisma.reminder.count({ where }),
  ]);
  res.json({ reminders, total });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const reminder = await prisma.reminder.create({
    data: { ...req.body, createdBy: req.user!.id },
  });
  res.status(201).json(reminder);
});

router.patch('/:id/complete', async (req: AuthRequest, res: Response) => {
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { completed: true, completedAt: new Date() },
  });
  res.json(reminder);
});

export default router;
