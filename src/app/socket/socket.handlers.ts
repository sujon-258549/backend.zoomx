import { Socket } from "socket.io";
import { SocketEvent, SocketRoom } from "./socket.events";
import { AuthedSocketData } from "./socket.types";

export const registerSocketHandlers = (socket: Socket) => {
  const data = socket.data as AuthedSocketData;
  const { userId, role } = data;

  // Personal + role-based fan-out rooms
  socket.join(SocketRoom.user(userId));
  socket.join(SocketRoom.role(role));

  socket.emit(SocketEvent.CONNECTED, {
    userId,
    role,
    connectedAt: new Date().toISOString(),
  });

  socket.on("disconnect", () => {
    // Auto-leaves all rooms; nothing extra to do.
  });
};
