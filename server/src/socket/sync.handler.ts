import { Socket } from 'socket.io';

export const syncHandler = (socket: Socket, io: any) => {
  socket.on('sync:play', (data: { roomId: string; time: number }) => {
    socket.to(data.roomId).emit('sync:play', { time: data.time });
  });

  socket.on('sync:pause', (data: { roomId: string; time: number }) => {
    socket.to(data.roomId).emit('sync:pause', { time: data.time });
  });

  socket.on('sync:seek', (data: { roomId: string; time: number }) => {
    socket.to(data.roomId).emit('sync:seek', { time: data.time });
  });

  socket.on('sync:request-state', (roomId: string) => {
    socket.to(roomId).emit('sync:request-state', socket.id);
  });

  socket.on('sync:state-response', (data: {
    requesterId: string;
    videoUrl: string | null;
    time: number;
    isPlaying: boolean;
  }) => {
    io.to(data.requesterId).emit('sync:state-update', {
      videoUrl: data.videoUrl,
      time: data.time,
      isPlaying: data.isPlaying,
    });
  });

  socket.on('sync:change-video', (data: { roomId: string; videoUrl: string }) => {
    socket.to(data.roomId).emit('sync:change-video', { videoUrl: data.videoUrl });
  });
};
