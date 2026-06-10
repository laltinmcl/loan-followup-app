import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, .csv files allowed'));
    }
  },
});

const router = Router();
router.use(authenticate);

router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const job = await prisma.importJob.create({
    data: {
      filename: req.file.originalname,
      filePath: req.file.path,
      status: 'pending',
      createdBy: req.user!.id,
    },
  });

  // Async processing would happen here in production
  // For now, return the job ID for tracking

  res.status(201).json({ jobId: job.id, status: 'pending', message: 'File queued for import' });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(jobs);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const job = await prisma.importJob.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: 'Import job not found' });
  res.json(job);
});

export default router;
