import config from "../../config";
import { formatInZone } from "../../utils/timezone";
import { EmailHelper } from "../../utils/emailHelper";
import { IMeeting } from "./meeting.interface";

/** Format a Date as an iCalendar UTC timestamp: 20260727T093000Z. */
const icsStamp = (d: Date): string =>
  new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** Escape reserved characters in an iCalendar text value. */
const icsText = (s = ""): string =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/**
 * Build a `.ics` calendar invite for the meeting so both parties can add it to
 * Google/Outlook/Apple Calendar in one click.
 */
const buildIcs = (m: IMeeting, title: string): { filename: string; content: Buffer; encoding: string } => {
  const uid = `${m._id ?? icsStamp(new Date())}@zoomx`;
  const organizer = m.adminEmail || config.sender_email || "no-reply@zoomx.com";
  const location = m.meetingUrl || "Online meeting";
  const desc = `${title}${m.meetingUrl ? `\\n\\nJoin: ${m.meetingUrl}` : ""}${
    m.notes ? `\\n\\nNotes: ${icsText(m.notes)}` : ""
  }`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZOOMX//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(m.startTime)}`,
    `DTEND:${icsStamp(m.endTime)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${icsText(location)}`,
    `ORGANIZER;CN=ZOOMX:mailto:${organizer}`,
    `ATTENDEE;CN=${icsText(m.name)};RSVP=TRUE:mailto:${m.email}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return {
    filename: "meeting.ics",
    content: Buffer.from(lines.join("\r\n"), "utf-8"),
    encoding: "utf-8",
  };
};

const BRAND = "#5c2e9d";
const FRONTEND = config.frontend_url || "http://localhost:3000";
const manageLink = (m: IMeeting): string =>
  m.manageToken ? `${FRONTEND}/meeting/manage/${m.manageToken}` : "";

/** Full-width, on-brand HTML shell shared by all meeting emails. */
const shell = (heading: string, bodyRows: string, footerNote: string): string => `
  <div style="margin:0;padding:0;width:100%;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a0a2e;">
    <div style="width:100%;background:#ffffff;overflow:hidden;">
      <div style="background:${BRAND};padding:22px 40px;">
        <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.3px;">ZOOMX Digital</span>
      </div>
      <div style="padding:32px 40px;">
        <h2 style="margin:0 0 18px;font-size:22px;">${heading}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">${bodyRows}</table>
        <p style="margin:24px 0 0;font-size:13px;color:#8a80a0;">${footerNote}</p>
      </div>
      <div style="background:#f4f0f9;padding:16px 40px;font-size:12px;color:#8a80a0;">
        © ZOOMX Digital — this is an automated message.
      </div>
    </div>
  </div>`;

const row = (label: string, value: string): string =>
  `<tr><td style="padding:6px 0;color:#8a80a0;width:120px;vertical-align:top;">${label}</td>
   <td style="padding:6px 0;font-weight:600;">${value}</td></tr>`;

/** A full-width block of admin-authored rich-text (HTML) inside the email table. */
const messageRow = (html?: string): string =>
  html
    ? `<tr><td colspan="2" style="padding:2px 0 14px;font-size:15px;line-height:1.6;">${html}</td></tr>`
    : "";

/**
 * Fire-and-forget: email the booker a confirmation (with .ics) and notify the
 * host. Never throws — a mail failure must not fail the booking itself.
 */
export const sendBookingEmails = async (m: IMeeting, title: string): Promise<void> => {
  if (!config.sender_email) return; // email not configured — skip silently

  const ics = buildIcs(m, title);
  const bookerWhen = formatInZone(m.startTime, m.bookerTimezone);
  const hostWhen = formatInZone(m.startTime, m.hostTimezone);
  const joinLink = m.meetingUrl
    ? `<a href="${m.meetingUrl}" style="color:${BRAND};">${m.meetingUrl}</a>`
    : "Sent separately";

  // 1) Booker confirmation
  const manage = manageLink(m);
  try {
    const html = shell(
      `You're booked, ${m.name.split(" ")[0]}! ✅`,
      row("What", title) +
        row("When", `${bookerWhen} (${m.bookerTimezone})`) +
        row("Duration", `${m.durationMinutes} minutes`) +
        row("Join link", joinLink) +
        (manage
          ? row(
              "Manage",
              `<a href="${manage}" style="color:${BRAND};">Reschedule or cancel</a>`,
            )
          : ""),
      "A calendar invite is attached. Need to change? Use the manage link above.",
    );
    await EmailHelper.sendEmail(
      m.email,
      html,
      `Meeting confirmed — ${bookerWhen}`,
      m.adminEmail || undefined,
      "ZOOMX Digital",
      ics,
    );
  } catch (err) {
    console.error("Booking confirmation email failed:", err);
  }

  // 2) Host notification
  const hostTo = m.adminEmail || config.sender_email;
  if (hostTo) {
    try {
      const html = shell(
        "New meeting booked 📅",
        row("Name", m.name) +
          row("Email", m.email) +
          (m.phone ? row("Phone", m.phone) : "") +
          row("When", `${hostWhen} (${m.hostTimezone})`) +
          row("Duration", `${m.durationMinutes} minutes`) +
          (m.notes ? row("Notes", m.notes) : ""),
        "This slot is now blocked on your booking calendar.",
      );
      await EmailHelper.sendEmail(
        hostTo,
        html,
        `New booking: ${m.name} — ${hostWhen}`,
        m.email,
        "ZOOMX Booking",
        ics,
      );
    } catch (err) {
      console.error("Booking host-notification email failed:", err);
    }
  }
};

/** Notify both parties that a booking was cancelled. `messageHtml` is the
 *  admin-configured rich-text cancellation message. */
export const sendCancellationEmails = async (m: IMeeting, messageHtml = ""): Promise<void> => {
  if (!config.sender_email) return;
  const bookerWhen = formatInZone(m.startTime, m.bookerTimezone);
  const hostWhen = formatInZone(m.startTime, m.hostTimezone);
  const rebook = `<a href="${FRONTEND}/#book-a-call" style="color:${BRAND};">Book a new time</a>`;

  const reasonRow = m.cancellationReason
    ? row("Reason", m.cancellationReason.replace(/</g, "&lt;"))
    : "";

  try {
    await EmailHelper.sendEmail(
      m.email,
      shell(
        "Your meeting was cancelled",
        messageRow(messageHtml) + row("When", `${bookerWhen} (${m.bookerTimezone})`) + reasonRow,
        `${rebook} whenever you're ready.`,
      ),
      `Cancelled — ${bookerWhen}`,
      undefined,
      "ZOOMX Digital",
    );
  } catch (err) {
    console.error("Cancellation email (booker) failed:", err);
  }

  const hostTo = m.adminEmail || config.sender_email;
  if (hostTo) {
    try {
      await EmailHelper.sendEmail(
        hostTo,
        shell(
          "A booking was cancelled",
          row("Name", m.name) +
            row("Email", m.email) +
            row("When", `${hostWhen} (${m.hostTimezone})`) +
            reasonRow,
          "This slot is now free again.",
        ),
        `Cancelled: ${m.name} — ${hostWhen}`,
      );
    } catch (err) {
      console.error("Cancellation email (host) failed:", err);
    }
  }
};

/** Notify both parties that a booking was moved to a new time. */
export const sendRescheduleEmails = async (m: IMeeting, title: string): Promise<void> => {
  if (!config.sender_email) return;
  const ics = buildIcs(m, title);
  const bookerWhen = formatInZone(m.startTime, m.bookerTimezone);
  const hostWhen = formatInZone(m.startTime, m.hostTimezone);
  const manage = manageLink(m);

  try {
    await EmailHelper.sendEmail(
      m.email,
      shell(
        "Your meeting was rescheduled ✅",
        row("What", title) +
          row("New time", `${bookerWhen} (${m.bookerTimezone})`) +
          row("Duration", `${m.durationMinutes} minutes`) +
          (manage ? row("Manage", `<a href="${manage}" style="color:${BRAND};">Reschedule or cancel</a>`) : ""),
        "An updated calendar invite is attached.",
      ),
      `Rescheduled — ${bookerWhen}`,
      m.adminEmail || undefined,
      "ZOOMX Digital",
      ics,
    );
  } catch (err) {
    console.error("Reschedule email (booker) failed:", err);
  }

  const hostTo = m.adminEmail || config.sender_email;
  if (hostTo) {
    try {
      await EmailHelper.sendEmail(
        hostTo,
        shell(
          "A booking was rescheduled",
          row("Name", m.name) + row("New time", `${hostWhen} (${m.hostTimezone})`),
          "Your calendar has been updated.",
        ),
        `Rescheduled: ${m.name} — ${hostWhen}`,
        undefined,
        "ZOOMX Booking",
        ics,
      );
    } catch (err) {
      console.error("Reschedule email (host) failed:", err);
    }
  }
};

/** Remind the booker their meeting is coming up (e.g. "24 hours", "1 hour"). */
export const sendReminderEmail = async (m: IMeeting, whenAway: string): Promise<void> => {
  if (!config.sender_email) return;
  const bookerWhen = formatInZone(m.startTime, m.bookerTimezone);
  const joinLink = m.meetingUrl
    ? `<a href="${m.meetingUrl}" style="color:${BRAND};">${m.meetingUrl}</a>`
    : "Sent separately";
  try {
    await EmailHelper.sendEmail(
      m.email,
      shell(
        `Reminder: your meeting is in ${whenAway} ⏰`,
        row("When", `${bookerWhen} (${m.bookerTimezone})`) + row("Join link", joinLink),
        "See you soon! Reply to this email if you need anything.",
      ),
      `Reminder — meeting in ${whenAway}`,
      m.adminEmail || undefined,
      "ZOOMX Digital",
    );
  } catch (err) {
    console.error("Reminder email failed:", err);
  }
};

/** Post-meeting follow-up email with the host's configured rich-text message. */
export const sendFollowupEmail = async (m: IMeeting, messageHtml: string): Promise<void> => {
  if (!config.sender_email) return;
  const bookerWhen = formatInZone(m.startTime, m.bookerTimezone);
  const body = messageRow(messageHtml) + row("Your meeting was", bookerWhen);
  try {
    await EmailHelper.sendEmail(
      m.email,
      shell(`Thanks for meeting with us, ${m.name.split(" ")[0]} 🙏`, body, "We appreciate your time."),
      "Thanks for your time",
      m.adminEmail || undefined,
      "ZOOMX Digital",
    );
  } catch (err) {
    console.error("Follow-up email failed:", err);
  }
};

/** "Meeting completed" email (sent when the host marks it completed). */
export const sendCompletedEmail = async (m: IMeeting, messageHtml: string): Promise<void> => {
  if (!config.sender_email) return;
  const bookerWhen = formatInZone(m.startTime, m.bookerTimezone);
  const body = messageRow(messageHtml) + row("Your meeting was", bookerWhen);
  try {
    await EmailHelper.sendEmail(
      m.email,
      shell(`Your meeting is complete, ${m.name.split(" ")[0]} ✅`, body, "Thanks again for your time."),
      "Meeting completed",
      m.adminEmail || undefined,
      "ZOOMX Digital",
    );
  } catch (err) {
    console.error("Completed email failed:", err);
  }
};
