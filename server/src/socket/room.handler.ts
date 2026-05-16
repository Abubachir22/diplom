import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../services/prisma';

interface SocketUser {
  socketId: string;
  userId: string;
  username: string;
  roomId: string;
  role: string;
}

const activeUsers: Map<string, SocketUser> = new Map();

export const getActiveUsers = () => activeUsers;

export const roomHandler = (socket: Socket, io: any) => {
  const token = socket.handshake.auth.token;
  let currentUser: SocketUser | null = null;

  try {
    if (token) {
      const decoded = verifyToken(token);
      currentUser = {
        socketId: socket.id,
        userId: decoded.userId,
        username: decoded.username,
        roomId: '',
        role: '',
      };
    }
  } catch {}

  socket.on('room:join', async (data: { roomId: string; username?: string; guestId?: string }) => {
    const { roomId } = data;
    const username = currentUser?.username || data.username || `Guest_${socket.id.slice(0, 5)}`;
    const userId = currentUser?.userId || data.guestId || `guest_${socket.id.slice(0, 8)}`;

    // Проверка бана
    if (userId) {
      try {
        const room = await prisma.room.findUnique({ where: { inviteCode: roomId } });
        if (room) {
          const banned = await prisma.ban.findUnique({
            where: { roomId_userId: { roomId: room.id, userId } },
          });
          if (banned) {
            socket.emit('kicked', { reason: 'You are banned from this room' });
            return;
          }
        }
      } catch {}
    }

    // Определяем роль
    let role = 'VIEWER';
    if (currentUser?.userId) {
      try {
        const room = await prisma.room.findUnique({ where: { inviteCode: roomId } });
        if (room && room.creatorId === currentUser.userId) {
          role = 'OWNER';
        }
      } catch {}
    }

    // Сохраняем в activeUsers с ролью
    activeUsers.set(socket.id, { socketId: socket.id, userId, username, roomId, role });
    socket.join(roomId);

    // Уведомляем всех о новом участнике
    io.to(roomId).emit('user:joined', {
      id: userId,
      username,
      role,
      joinedAt: new Date().toISOString(),
    });

    // Собираем список ВСЕХ участников с их ролями
    const roomUsers: { userId: string; username: string; role: string }[] = [];
    activeUsers.forEach((u) => {
      if (u.roomId === roomId) {
        roomUsers.push({
          userId: u.userId,
          username: u.username,
          role: u.role,
        });
      }
    });

    io.to(roomId).emit('room:users', roomUsers);
  });

  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    const user = activeUsers.get(socket.id);
    if (user) {
      io.to(roomId).emit('user:left', user.userId);
      activeUsers.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      io.to(user.roomId).emit('user:left', user.userId);
      activeUsers.delete(socket.id);
    }
  });
};