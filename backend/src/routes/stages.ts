import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const VALID_TRANSITIONS: Record<string, string[]> = {
  import: ['soft_call', 'notice'],
  soft_call: ['field_visit', 'promise_paid', 'escalate'],
  notice: ['field_visit', 'promise_paid', 'legal'],
  field_visit: ['promise_paid', 'escalate', 'resolved'],
  promise_paid: ['field_visit', 'resolved', 'soft_call'],
  escalate: ['field_visit', 'legal', 'manager_review'],
  legal: ['escalate', 'written_off', 'resolved'],
  manager_review: ['escalate', 'field_visit', 'resolved'],
  written_off: ['resolved'],
  resolved: [],
};

router.get('/', async (_req: AuthRequest, res: Response) => {
  const stages = await prisma.followupStage.findMany({
    include: { loan: true, assignedToRel: { select: { id: true, name: true } } },
    orderBy: { stageEnteredAt: 'desc' },
  });
  res.json(stages);
});

router.get('/board', async (_req: AuthRequest, res: Response) => {
  const stages = await prisma.followupStage.findMany({
    include: { loan: { select: { id: true, accountNo: true, memberName: true, loanCategory: true, totalDue: true, dueCount: true } } },
  });

  const board: Record<string, any[]> = {};
  for (const s of stages) {
    if (!board[s.currentStage]) board[s.currentStage] = [];
    board[s.currentStage].push(s);
  }

  res.json(board);
});

router.get('/:loanId', async (req: AuthRequest, res: Response) => {
  const stage = await prisma.followupStage.findUnique({
    where: { loanId: req.params.loanId },
    include: { stageHistory: { orderBy: { createdAt: 'desc' } } },
  });
  if (!stage) return res.status(404).json({ error: 'Stage not found' });
  res.json(stage);
});

router.post('/:loanId/transition', async (req: AuthRequest, res: Response) => {
  const { toStage, note } = req.body;
  const stage = await prisma.followupStage.findUnique({ where: { loanId: req.params.loanId } });
  if (!stage) return res.status(404).json({ error: 'Stage not found' });

  const allowed = VALID_TRANSITIONS[stage.currentStage] || [];
  if (!allowed.includes(toStage)) {
    return res.status(400).json({ error: `Cannot transition from '${stage.currentStage}' to '${toStage}'` });
  }

  const [updated] = await prisma.$transaction([
    prisma.followupStage.update({
      where: { loanId: req.params.loanId },
      data: { currentStage: toStage, stageEnteredAt: new Date(), notes: note || undefined },
    }),
    prisma.stageHistory.create({
      data: {
        stageId: stage.id,
        fromStage: stage.currentStage,
        toStage,
        transitionedBy: req.user!.id,
        note: note || null,
      },
    }),
  ]);

  res.json(updated);
});

export default router;
