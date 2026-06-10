import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, status, stage, search, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};
  if (category) where.loanCategory = category;
  if (status) where.status = status;
  if (search) where.memberName = { contains: search as string, mode: 'insensitive' };
  if (stage) where.followupStage = { currentStage: stage };

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { followupStage: true },
    }),
    prisma.loan.count({ where }),
  ]);

  res.json({ loans, total, page: parseInt(page as string), limit: take });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const loan = await prisma.loan.findUnique({
    where: { id: req.params.id },
    include: {
      followupStage: { include: { stageHistory: { orderBy: { createdAt: 'desc' } } } },
      fieldVisits: { orderBy: { visitDate: 'desc' } },
      reminders: { orderBy: { dueDate: 'asc' } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  res.json(loan);
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const loan = await prisma.loan.update({
    where: { id: req.params.id },
    data: req.body,
  });
  await prisma.activityLog.create({
    data: {
      loanId: loan.id,
      action: 'loan_updated',
      description: 'Loan details updated',
      createdBy: req.user!.id,
      metadata: { changes: Object.keys(req.body) },
    },
  });
  res.json(loan);
});

export default router;
