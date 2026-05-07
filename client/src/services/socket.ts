import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket?.connected) {
    socket = io(URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error.message);
    });
  }

  return socket;
};