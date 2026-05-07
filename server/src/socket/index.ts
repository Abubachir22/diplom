import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { roomHandler } from './room.handler';
import { syncHandler } from './sync.handler';
import { chatHandler } from './chat.handler';

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    roomHandler(socket, io);
    syncHandler(socket, io);
    chatHandler(socket, io);
  });

  console.log('[SOCKET] РРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅ');
  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO РЅРµ РёРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅ');
  return io;
};
