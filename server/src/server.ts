import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './socket/index';

const httpServer = http.createServer(app);
const io = initSocket(httpServer);
app.set('io', io);

httpServer.listen(env.PORT, () => {
  console.log(`[SERVER] Запущен на http://localhost:${env.PORT}`);
  console.log(`[SERVER] Клиент: ${env.CLIENT_URL}`);
});