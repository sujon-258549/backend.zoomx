import { Schema, model } from "mongoose";
import { IActionLog } from "./actionLog.interface";

const actionLogSchema = new Schema({
  email: String,
  role: String,
  method: String,
  route: String,
  action: String,
  clientDetails: {
    ipAddress: String,
    userAgent: String,
    browserUrl: String,
    accessedAt: Date,
  },
  serverDetails: {
    hostname: String,
    platform: String,
    uptime: String,
  },

  requestStatusCode: Number,
  responseStatusCode: Number,
  timestamp: { type: Date, default: Date.now },
});

// Auto-cleanup: MongoDB deletes action logs older than this automatically
// (TTL index). Change the day count to keep logs longer or shorter.
const ACTION_LOG_RETENTION_DAYS = 30;
actionLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: ACTION_LOG_RETENTION_DAYS * 24 * 60 * 60 }
);

export const ActionLog = model<IActionLog>("ActionLog", actionLogSchema);
