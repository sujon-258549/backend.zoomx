import cron from "node-cron";
import { MeetingServices } from "./meeting.service";

let started = false;

/**
 * Start the meeting reminder sweep. Runs every 5 minutes and sends 24h/1h
 * reminder emails for imminent bookings (each reminder is sent at most once,
 * tracked by the `reminded24h`/`reminded1h` flags on the meeting).
 */
export const startMeetingReminders = (): void => {
  if (started) return;
  started = true;

  cron.schedule("*/5 * * * *", async () => {
    try {
      await MeetingServices.sendDueReminders();
    } catch (err) {
      console.error("Meeting reminder sweep failed:", err);
    }
  });

  console.log("⏰ Meeting reminder scheduler started (every 5 min)");
};
