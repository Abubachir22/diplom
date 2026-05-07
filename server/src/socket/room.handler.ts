import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

interface SocketUser {
  socketId: string;
  userId: string;
  username: string;
  roomId: string;
}

const activeUsers: Map<string, SocketUser> = new Map();

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
      };
    }
  } catch {}

  socket.on('room:join', (data: { roomId: string; username?: string }) => {
    const { roomId } = data;
    const username = currentUser?.username || data.username || `Гость_${socket.id.slice(0, 5)}`;
    const userId = currentUser?.userId || `guest_${socket.id}`;

    activeUsers.set(socket.id, { socketId: socket.id, userId, username, roomId });
    socket.join(roomId);

    io.to(roomId).emit('user:joined', {
      id: userId,
      username,
      role: 'VIEWER',
      joinedAt: new Date().toISOString(),
    });

    const roomUsers: SocketUser[] = [];
    activeUsers.forEach((u) => {
      if (u.roomId === roomId) roomUsers.push(u);
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