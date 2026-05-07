import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prisma';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { hashPassword } from '../utils/password';

const router = Router();

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  isPrivate: z.boolean().default(false),
  password: z.string().min(4).max(50).optional(),
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRoomSchema.parse(req.body);
    const inviteCode = uuidv4().slice(0, 8);
    let hashedPassword: string | undefined;
    if (data.isPrivate && data.password) {
      hashedPassword = await hashPassword(data.password);
    }
    const room = await prisma.room.create({
      data: {
        name: data.name,
        isPrivate: data.isPrivate,
        password: hashedPassword || null,
        inviteCode,
        creatorId: req.user!.userId,
        participants: { create: { userId: req.user!.userId, role: 'OWNER' } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
        },
      },
    });
    res.status(201).json({ room });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ', details: e.errors }); return; }
    next(e);
  }
});

router.get('/', optionalAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isPrivate: false },
      include: {
        _count: { select: { participants: true } },
        creator: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const mapped = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      inviteCode: r.inviteCode,
      videoUrl: r.videoUrl,
      viewers: r._count.participants,
      host: r.creator.username,
      createdAt: r.createdAt,
    }));
    res.json({ rooms: mapped });
  } catch (e) { next(e); }
});

router.get('/:inviteCode', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await prisma.room.findUnique({
      where: { inviteCode: req.params.inviteCode },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
        },
        creator: { select: { id: true, username: true } },
      },
    });
    if (!room) { res.status(404).json({ error: 'РљРѕРјРЅР°С‚Р° РЅРµ РЅР°Р№РґРµРЅР°' }); return; }
    res.json({ room });
  } catch (e) { next(e); }
});

// удаление комнаты
router.delete('/:inviteCode', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await prisma.room.findUnique({
      where: { inviteCode: req.params.inviteCode },
    });

    if (!room) {
      res.status(404).json({ error: 'Комната не найдена' });
      return;
    }

    if (room.creatorId !== req.user!.userId) {
      res.status(403).json({ error: 'Только создатель может удалить комнату' });
      return;
    }

    await prisma.room.delete({
      where: { inviteCode: req.params.inviteCode },
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
