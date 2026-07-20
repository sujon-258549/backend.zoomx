import jwt, { JwtPayload } from "jsonwebtoken";
import { ExtendedError, Socket } from "socket.io";
import config from "../config";
import { UserRole } from "../modules/user/user.interface";
import { AuthedSocketData } from "./socket.types";

const getTokenFromHandshake = (socket: Socket): string | null => {
  const authToken = (socket.handshake.auth as { token?: string })?.token;
  if (authToken) return authToken;
  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
};

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const token = getTokenFromHandshake(socket);
    if (!token) {
      return next(new Error("UNAUTHORIZED: missing auth token"));
    }

    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string
    ) as JwtPayload & {
      userId?: string;
      email?: string;
      role?: UserRole;
      name?: string;
    };

    if (!decoded?.userId || !decoded?.role) {
      return next(new Error("UNAUTHORIZED: invalid token payload"));
    }

    const authData: AuthedSocketData = {
      userId: String(decoded.userId),
      email: String(decoded.email ?? ""),
      role: decoded.role,
      name: decoded.name,
    };
    Object.assign(socket.data, authData);
    return next();
  } catch (err) {
    return next(new Error("UNAUTHORIZED: invalid token"));
  }
};
