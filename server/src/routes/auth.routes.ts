import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../services/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      res.status(409).json({
        error: existing.email === data.email ? 'Email СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ' : 'РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р·Р°РЅСЏС‚Рѕ',
      });
      return;
    }
    const user = await prisma.user.create({
      data: { ...data, password: await hashPassword(data.password) },
    });
    const token = signToken({ userId: user.id, username: user.username, email: user.email });
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ', details: e.errors }); return; }
    next(e);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await comparePassword(data.password, user.password))) {
      res.status(401).json({ error: 'РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ' });
      return;
    }
    const token = signToken({ userId: user.id, username: user.username, email: user.email });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ' }); return; }
    next(e);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ' }); return; }
    res.json({ user });
  } catch (e) { next(e); }
});

export default router;
