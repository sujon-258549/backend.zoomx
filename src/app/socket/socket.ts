import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { socketCorsOptions } from "./socket.config";
import { registerSocketHandlers } from "./socket.handlers";
import { socketAuthMiddleware } from "./socket.middleware";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: socketCorsOptions,
    transports: ["websocket", "polling"],
  });

  io.use(socketAuthMiddleware);
  io.on("connection", registerSocketHandlers);

  console.log("⚡ Socket.IO initialized");
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized. Call initSocket(server) first."
    );
  }
  return io;
};

// Safe accessor — returns null instead of throwing. Use this from feature
// services so a missing socket layer doesn't break the request flow.
export const tryGetIO = (): SocketIOServer | null => io;
