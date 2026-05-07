import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export const chatHandler = (socket: Socket, io: any) => {
  socket.on('chat:send', (data: { roomId: string; text: string; username: string; userId: string }) => {
    const message = {
      id: uuidv4(),
      text: data.text,
      userId: data.userId,
      username: data.username,
      roomId: data.roomId,
      createdAt: new Date().toISOString(),
    };
    io.to(data.roomId).emit('chat:message', message);
  });
};
