// // src/middlewares/actionLogger.ts

// import { NextFunction, Request, Response } from "express";
// import os from "os";
// import catchAsync from "../utils/catchAsync";

// export const actionLogger = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       if (!req.user) return next();

//       const { method, originalUrl, headers, socket } = req;

//       // Parse headers
//       const rawClientDetails = headers["x-client-details"];
//       const clientDetails =
//         typeof rawClientDetails === "string"
//           ? JSON.parse(rawClientDetails)
//           : {};

//       const xAction = headers["x-action"]?.toString();
//       const userAgent = headers["user-agent"]?.toString();
//       const ipAddress =
//         headers["x-forwarded-for"]?.toString().split(",")[0] ||
//         socket.remoteAddress ||
//         "Unknown";

//       const payload = {
//         email: req.user.email,
//         role: req.user.role,
//         method,
//         route: originalUrl,
//         action: xAction || `${method} ${originalUrl}`,
//         clientDetails: {
//           ipAddress: clientDetails?.ipAddress || ipAddress,
//           userAgent: clientDetails?.userAgent || userAgent,
//           browserUrl: clientDetails?.browserUrl || "",
//           accessedAt: clientDetails?.accessedAt || new Date().toISOString(),
//         },
//         serverDetails: {
//           hostname: os.hostname(),
//           platform: os.platform(),
//           uptime: formatUptime(os.uptime()),
//         },
//         statusCode: res.statusCode,
//         responseStatusCode: // add response status code
//         timestamp: new Date(),
//       };

//       // await ActionLog.create(payload);
//     } catch (error) {
//       console.error("❌ Logging Error:", error);
//     }

//     next();
//   }
// );

// const formatUptime = (uptime: number): string => {
//   const hours = Math.floor(uptime / 3600);
//   const minutes = Math.floor((uptime % 3600) / 60);
//   return `${hours} hours ${minutes} minutes`;
// };
// src/middlewares/actionLogger.ts

import { NextFunction, Request, Response } from "express";
import os from "os";
import { ActionLog } from "../modules/actionLog/actionLog.model";
import catchAsync from "../utils/catchAsync";
// import { ActionLog } from "../models/ActionLog"; // Uncomment when using DB

export const actionLogger = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();

    const { method, originalUrl, headers, socket } = req;

    const rawClientDetails = headers["x-client-details"];
    const clientDetails =
      typeof rawClientDetails === "string" ? JSON.parse(rawClientDetails) : {};

    const xAction = headers["x-action"]?.toString();
    const userAgent = headers["user-agent"]?.toString();
    const ipAddress =
      headers["x-forwarded-for"]?.toString().split(",")[0] ||
      socket.remoteAddress ||
      "Unknown";

    res.on("finish", async () => {
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

      try {
        // Save to DB
        await ActionLog.create(payload);
      } catch (error) {
        console.error("❌ Failed to save action log:", error);
      }
    });

    next();
  }
);

const formatUptime = (uptime: number): string => {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${hours} hours ${minutes} minutes`;
};
