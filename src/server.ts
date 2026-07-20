import { createServer, Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import seedAdmin from "./app/db/seed";
import redis from "./app/shared/redis";
import { initSocket } from "./app/socket";


let server: Server | null = null;

// Database connection
async function connectToDatabase() {
  try {
    await mongoose.connect(config.db_url as string);
    console.log("🛢 Database connected successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
}


// Graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  if (server) {
    server.close(async () => {
      console.log("Server closed gracefully");
      try {
        await redis.quit();
        console.log("Redis connection closed");
      } catch (err) {
        console.error("Error closing Redis:", err);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Application bootstrap
async function bootstrap() {
  try {
    await connectToDatabase();
    await seedAdmin();

    server = createServer(app);
    initSocket(server);

    server.listen(config.port, () => {
      console.log(
        `🚀 Application is running on port http://localhost:${config.port}`
      );
      // Storefront on-demand revalidation config — so a missing env is obvious
      // in the deploy logs instead of silently failing on the next product edit.
      if (process.env.FRONTEND_URL && process.env.REVALIDATE_SECRET) {
        console.log(
          `🔄 Frontend revalidation ON → ${process.env.FRONTEND_URL}`
        );
      } else {
        console.warn(
          "⚠️  Frontend revalidation OFF — set FRONTEND_URL and REVALIDATE_SECRET (product edits won't refresh the storefront immediately)"
        );
      }
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
  } catch (error) {
    console.error("Error during bootstrap:", error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
