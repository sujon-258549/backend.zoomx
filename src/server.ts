import { createServer, Server } from "http";
import app from "./app";
import config from "./app/config";


let server: Server | null = null;


// Graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

server = createServer(app);

server.listen(config.port, () => {
  console.log(`🚀 Application is running on port http://localhost:${config.port}`);
});

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  gracefulShutdown("unhandledRejection");
});
