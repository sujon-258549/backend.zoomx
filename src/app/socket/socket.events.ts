export const SocketEvent = {
  // Server -> client
  CONNECTED: "socket:connected",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_READ_ALL: "notification:read-all",
  NOTIFICATION_UNREAD_COUNT: "notification:unread-count",
} as const;

export const SocketRoom = {
  role: (role: string) => `role:${role}`,
  user: (userId: string) => `user:${userId}`,
};
