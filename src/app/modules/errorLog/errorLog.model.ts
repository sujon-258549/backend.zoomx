import { Schema, model } from "mongoose";
import { IErrorLog } from "./errorLog.interface";

const errorLogSchema = new Schema<IErrorLog>({
  message: { type: String, required: true },
  statusCode: { type: Number, default: 500 },
  method: String,
  route: String,
  userId: String,
  email: String,
  role: String,
  stack: String,
  errorName: String,
  errorSources: [
    {
      _id: false,
      path: String,
      message: String,
    },
  ],
  body: Schema.Types.Mixed,
  query: Schema.Types.Mixed,
  params: Schema.Types.Mixed,
  clientDetails: {
    ipAddress: String,
    userAgent: String,
    browserUrl: String,
  },
  timestamp: { type: Date, default: Date.now },
});

// Auto-cleanup: MongoDB deletes error logs older than this automatically
// (TTL index). Change the day count to keep logs longer or shorter.
const ERROR_LOG_RETENTION_DAYS = 30;
errorLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: ERROR_LOG_RETENTION_DAYS * 24 * 60 * 60 }
);

export const ErrorLog = model<IErrorLog>("ErrorLog", errorLogSchema);
