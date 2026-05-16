import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prisma';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { hashPassword, comparePassword } from '../utils/password';
import { getActiveUsers } from '../socket/room.handler';

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
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'Invalid data', details: e.errors }); return; }
    next(e);
  }
});

router.get('/', optionalAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({
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
      isPrivate: r.isPrivate,
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
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    res.json({ room });
  } catch (e) { next(e); }
});

router.post('/:inviteCode/join', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await prisma.room.findUnique({
      where: { inviteCode: req.params.inviteCode },
      include: { participants: true },
    });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    const userId = req.user?.userId || req.body.guestId || `guest_${req.ip}`;

    const banned = await prisma.ban.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });
    if (banned) { res.status(403).json({ error: 'You are banned from this room' }); return; }

    if (room.isPrivate && room.password) {
      const { password } = req.body;
      if (!password) { res.status(403).json({ error: 'Password required' }); return; }
      const valid = await comparePassword(password, room.password);
      if (!valid) { res.status(403).json({ error: 'Wrong password' }); return; }
    }

    if (req.user) {
      const existing = await prisma.roomParticipant.findUnique({
        where: { userId_roomId: { userId: req.user.userId, roomId: room.id } },
      });
      if (!existing) {
        await prisma.roomParticipant.create({
          data: { userId: req.user.userId, roomId: room.id, role: 'VIEWER' },
        });
      }
    }

    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post('/:inviteCode/ban', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await prisma.room.findUnique({ where: { inviteCode: req.params.inviteCode } });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (room.creatorId !== req.user!.userId) { res.status(403).json({ error: 'Only owner can ban' }); return; }

    const { userId } = req.body;
    if (!userId) { res.status(400).json({ error: 'userId is required' }); return; }

    await prisma.ban.create({ data: { roomId: room.id, userId } });
    await prisma.roomParticipant.deleteMany({ where: { roomId: room.id, userId } });

    // Выгоняем из сокет-комнаты
    try {
      const activeUsers = getActiveUsers();
      const io = req.app.get('io');
      if (io) {
        const sockets = await io.in(req.params.inviteCode).fetchSockets();
        for (const s of sockets) {
          const user = activeUsers.get(s.id);
          if (user && user.userId === userId) {
            s.leave(req.params.inviteCode);
            s.emit('kicked', { reason: 'You have been banned' });
          }
        }
      }
    } catch {}

    res.json({ success: true });
  } catch (e) { next(e); }
});

router.delete('/:inviteCode', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await prisma.room.findUnique({ where: { inviteCode: req.params.inviteCode } });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (room.creatorId !== req.user!.userId) { res.status(403).json({ error: 'Only creator can delete' }); return; }
    await prisma.room.delete({ where: { inviteCode: req.params.inviteCode } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;