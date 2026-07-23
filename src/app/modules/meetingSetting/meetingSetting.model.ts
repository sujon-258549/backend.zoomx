import { Schema, model } from "mongoose";
import { IMeetingSetting } from "./meetingSetting.interface";

const windowSchema = new Schema(
  {
    start: { type: String, trim: true, required: true },
    end: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const availabilityDaySchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    enabled: { type: Boolean, default: false },
    windows: { type: [windowSchema], default: [] },
  },
  { _id: false }
);

const meetingSettingSchema = new Schema<IMeetingSetting>(
  {
    title: { type: String, trim: true, default: "Book a Meeting" },
    description: { type: String, trim: true },
    timezone: { type: String, trim: true, default: "Asia/Dhaka" },
    adminEmail: { type: String, trim: true, lowercase: true, default: "" },
    meetingUrl: { type: String, trim: true, default: "" },
    slotDurationMinutes: { type: Number, default: 30, min: 5, max: 480 },
    bufferMinutes: { type: Number, default: 0, min: 0, max: 240 },
    maxAdvanceDays: { type: Number, default: 30, min: 1, max: 365 },
    minNoticeHours: { type: Number, default: 2, min: 0, max: 720 },
    availabilityDays: { type: [availabilityDaySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export const MeetingSetting = model<IMeetingSetting>(
  "MeetingSetting",
  meetingSettingSchema
);
