import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import morgan from "morgan";
import os from "os";
import path from "path";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import { apiRateLimit } from "./app/middleware/rateLimit";
import router from "./app/routes";
import { UploadRoutes } from "./app/routes/upload.route";
import sendResponse from "./app/utils/sendResponse";
import config from "./app/config";

const app: Application = express();

// Dokploy's Traefik reverse proxy sits directly in front of this container and
// sets X-Forwarded-For — trusting exactly one hop lets Express (and
// express-rate-limit) resolve the real client IP from that header without
// blindly trusting X-Forwarded-For values a client could inject themselves.
app.set("trust proxy", 1);

const getClientIp = (req: Request): string => {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0]!.trim();
  if (Array.isArray(xf)) return xf[0]!.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
};

const formatUptime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return {
    totalSeconds: Math.floor(totalSeconds),
    formatted: `${h}h ${m}m ${s}s`,
  };
};

// Middleware setup
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

// "*" can't be sent alongside credentials: true (browsers reject that
// combination outright), so treat it as "allow any origin" by reflecting
// the request's own Origin header instead of a literal "*".
const allowAnyOrigin = config.cors_origin.includes("*");
app.use(
  cors({
    origin: allowAnyOrigin ? true : config.cors_origin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static folder for image access
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("", UploadRoutes);
app.use("/api", apiRateLimit, router);

// seedAdmin();

app.get("/", (req: Request, res: Response, _next: NextFunction) => {
  const serverUptime = os.uptime();
  const uptime = formatUptime(serverUptime);
  const env = process.env.NODE_ENV ?? "development";

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message:
      "Welcome to ZOOMX Digital API. The API is healthy and ready to serve requests.",
    data: {
      api: {
        name: "ZOOMX Digital Backend",
        version: "1.0.1",
        basePath: "/api",
      },
      request: {
        clientIp: getClientIp(req),
        receivedAt: new Date().toISOString(),
      },
      runtime: {
        environment: env,
        uptime,
        host: os.hostname(),
        platform: os.platform(),
      },
      support: {
        email: "info@thezoomit.com",
        website: "https://thezoomit.com",
      },
    },
  });
});

app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app; // Export the app for use in server.ts
