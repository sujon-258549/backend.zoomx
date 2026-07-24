import { Schema, model } from "mongoose";
import { IMeeting } from "./meeting.interface";

const meetingSchema = new Schema<IMeeting>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    notes: { type: String, trim: true },

    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },

    bookerTimezone: { type: String, trim: true, required: true },
    hostTimezone: { type: String, trim: true, required: true },

    meetingUrl: { type: String, trim: true },
    adminEmail: { type: String, trim: true },

    customAnswers: {
      type: [
        new Schema(
          { question: { type: String, trim: true }, answer: { type: String, trim: true } },
          { _id: false }
        ),
      ],
      default: [],
    },

    adminNote: { type: String, trim: true, default: "" },
    cancellationReason: { type: String, trim: true, default: "" },

    manageToken: { type: String, trim: true, index: true },
    reminderSent: { type: Boolean, default: false },
    followupSent: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
      index: true,
    },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// A given start instant can only hold one live (non-cancelled) meeting.
meetingSchema.index(
  { startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "confirmed", is_deleted: false },
  }
);

export const Meeting = model<IMeeting>("Meeting", meetingSchema);
