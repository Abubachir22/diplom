import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './socket/index';

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[SERVER] Р—Р°РїСѓС‰РµРЅ РЅР° http://localhost:${env.PORT}`);
  console.log(`[SERVER] РљР»РёРµРЅС‚: ${env.CLIENT_URL}`);
});
