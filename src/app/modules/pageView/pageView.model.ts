import { Schema, model } from "mongoose";
import { TRAFFIC_SOURCES } from "./pageView.constant";
import { IPageView } from "./pageView.interface";

const pageViewSchema = new Schema<IPageView>(
  {
    path: { type: String, required: true, index: true },
    full_url: { type: String },
    referrer: { type: String },
    source: {
      type: String,
      enum: TRAFFIC_SOURCES,
      default: "Direct",
      index: true,
    },
    session_id: { type: String, required: true, index: true },
    visitor_id: { type: String, index: true },
    user_agent: { type: String },
    browser: { type: String },
    os: { type: String },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    ip_address: { type: String },
    country: { type: String },
    is_bot: { type: Boolean, default: false, index: true },
    duration_ms: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  }
);

pageViewSchema.index({ timestamp: -1, is_bot: 1 });
pageViewSchema.index({ session_id: 1, timestamp: 1 });

export const PageView = model<IPageView>("PageView", pageViewSchema);
