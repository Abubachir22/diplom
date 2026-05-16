import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      title: z.string().min(1),
      videoUrl: z.string(),
      scheduledAt: z.string(),
    }).parse(req.body);

    // Создаём комнату для события
    const inviteCode = uuidv4().slice(0, 8);
    const room = await prisma.room.create({
      data: {
        name: data.title,
        isPrivate: false,
        inviteCode,
        creatorId: req.user!.userId,
        participants: { create: { userId: req.user!.userId, role: 'OWNER' } },
      },
    });

    const event = await prisma.event.create({
      data: {
        title: data.title,
        videoUrl: data.videoUrl,
        scheduledAt: new Date(data.scheduledAt),
        creatorId: req.user!.userId,
        roomId: room.id,
      },
    });

    res.status(201).json({ event, room });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'Invalid data', details: e.errors }); return; }
    next(e);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: { select: { username: true } },
        room: { select: { inviteCode: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json({ events });
  } catch (e) { next(e); }
});

export default router;