import { Router } from 'express';
import authRoutes from './auth.routes';
import roomRoutes from './room.routes';
import proxyRoutes from './proxy.routes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/proxy', proxyRoutes);
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
export default router;