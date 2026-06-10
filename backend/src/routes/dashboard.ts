import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (_req: AuthRequest, res: Response) => {
  const [totalLoans, activeLoans, totalOverdue, totalPortfolio, stageCounts, categoryCounts] =
    await Promise.all([
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'active' } }),
      prisma.loan.aggregate({ _sum: { totalDue: true }, where: { dueCount: { gt: 0 } } }),
      prisma.loan.aggregate({ _sum: { disburseAmount: true } }),
      prisma.followupStage.groupBy({ by: ['currentStage'], _count: true }),
      prisma.loan.groupBy({ by: ['loanCategory'], _count: true, _sum: { totalDue: true, disburseAmount: true } }),
    ]);

  res.json({
    totalLoans,
    activeLoans,
    overdueLoans: totalOverdue._sum.totalDue,
    totalPortfolio: totalPortfolio._sum.disburseAmount,
    stageCounts: stageCounts.map((s) => ({ stage: s.currentStage, count: s._count })),
    categoryBreakdown: categoryCounts.map((c) => ({
      category: c.loanCategory,
      count: c._count,
      totalDue: c._sum.totalDue,
      totalDisbursed: c._sum.disburseAmount,
    })),
  });
});

router.get('/aging', async (_req: AuthRequest, res: Response) => {
  const buckets = await prisma.loan.groupBy({
    by: ['dueCount'],
    _count: true,
    _sum: { totalDue: true, disburseAmount: true },
    orderBy: { dueCount: 'asc' },
  });
  res.json(buckets);
});

export default router;
