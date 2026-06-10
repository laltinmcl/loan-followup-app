import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { loanId, action, page = '1', limit = '50' } = req.query;
  const where: any = {};
  if (loanId) where.loanId = loanId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: { createdByRel: { select: { name: true } }, loan: { select: { accountNo: true, memberName: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  res.json({ logs, total });
});

export default router;
