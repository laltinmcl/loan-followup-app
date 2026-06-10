import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { loanId, status, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (loanId) where.loanId = loanId;
  if (status) where.status = status;

  const [visits, total] = await Promise.all([
    prisma.fieldVisit.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { visitDate: 'desc' },
      include: { loan: { select: { accountNo: true, memberName: true } } },
    }),
    prisma.fieldVisit.count({ where }),
  ]);
  res.json({ visits, total });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const visit = await prisma.fieldVisit.create({
    data: { ...req.body, createdBy: req.user!.id },
  });
  await prisma.activityLog.create({
    data: {
      loanId: visit.loanId,
      action: 'field_visit_created',
      description: `Field visit logged: ${visit.status}`,
      createdBy: req.user!.id,
    },
  });
  res.status(201).json(visit);
});

router.post('/sync', async (req: AuthRequest, res: Response) => {
  const visits = req.body.visits || [];
  const created = [];
  for (const v of visits) {
    const visit = await prisma.fieldVisit.create({
      data: { ...v, synced: true, syncedAt: new Date(), createdBy: req.user!.id },
    });
    created.push(visit);
  }
  res.status(201).json({ synced: created.length });
});

export default router;
