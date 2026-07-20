// src/app/middleware/actionLogger.ts
//
// After every authenticated write request, insert a row into ActionLog so we
// can audit who did what. Runs as a global middleware — attached to the /api
// router — so no per-route wiring is needed.
//
// Design:
// - Register a `res.on("finish")` listener up front and call `next()`
//   immediately, so the middleware never blocks the request.
// - Read `req.user` inside the listener (not at middleware-call time), so we
//   correctly capture it even when auth runs *after* this middleware.
// - Skip GET/HEAD/OPTIONS — they're reads and would balloon the log table.
// - Skip anonymous requests and Action-Log-fetch requests (avoid feedback loops).
// - Never fail the request if the DB write blows up; log and move on.

import { NextFunction, Request, Response } from "express";
import os from "os";
import { ActionLog } from "../modules/actionLog/actionLog.model";

const SKIPPED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SKIPPED_PATH_PREFIXES = ["/api/action-logs", "/api/error-logs"];

const formatUptime = (uptime: number): string => {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${hours} hours ${minutes} minutes`;
};

const shouldSkip = (req: Request): boolean => {
  if (SKIPPED_METHODS.has(req.method)) return true;
  return SKIPPED_PATH_PREFIXES.some((prefix) =>
    req.originalUrl.startsWith(prefix),
  );
};

export const actionLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (shouldSkip(req)) return next();

  const { method, originalUrl, headers, socket } = req;

  let clientDetails: Record<string, string> = {};
  const rawClientDetails = headers["x-client-details"];
  if (typeof rawClientDetails === "string") {
    try {
      clientDetails = JSON.parse(rawClientDetails) ?? {};
    } catch {
      // Silently ignore malformed x-client-details; other fields still get logged.
    }
  }

  const xAction = headers["x-action"]?.toString();
  const userAgent = headers["user-agent"]?.toString();
  const ipAddress =
    headers["x-forwarded-for"]?.toString().split(",")[0] ||
    socket.remoteAddress ||
    "Unknown";

  res.on("finish", () => {
    // Only log if the request was authenticated — anonymous traffic is noise.
    if (!req.user) return;

    const payload = {
      email: req.user.email,
      role: req.user.role,
      method,
      route: originalUrl,
      action: xAction || `${method} ${originalUrl}`,
      clientDetails: {
        ipAddress: clientDetails?.ipAddress || ipAddress,
        userAgent: clientDetails?.userAgent || userAgent,
        browserUrl: clientDetails?.browserUrl || "",
        accessedAt: clientDetails?.accessedAt || new Date().toISOString(),
      },
      serverDetails: {
        hostname: os.hostname(),
        platform: os.platform(),
        uptime: formatUptime(os.uptime()),
      },
      requestStatusCode: 200,
      responseStatusCode: res.statusCode,
      timestamp: new Date(),
    };

    // Fire-and-forget — never let a log failure poison the request lifecycle.
    ActionLog.create(payload).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to save action log:", error);
    });
  });

  next();
};
