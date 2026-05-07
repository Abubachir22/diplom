import { useEffect, useRef, useCallback, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "../services/socket";

export const useSocket = (token?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sock = getSocket(token);
    socketRef.current = sock;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);

    if (sock.connected) {
      setConnected(true);
    }

    return () => {
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
    };
  }, [token]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const joinRoom = useCallback((roomId: string, username?: string) => {
    console.log("[SOCKET] Emitting room:join", roomId, username);
    socketRef.current?.emit("room:join", { roomId, username });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("room:leave", roomId);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
    joinRoom,
    leaveRoom,
  };
};