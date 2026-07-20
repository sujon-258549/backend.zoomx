import { model } from "mongoose";

const mongoose = require("mongoose");

/**
 * NOTE: Stub model.
 * The original `service` module was removed from this codebase, but several
 * live features still query it (dashboard stats, sitemap generation, and the
 * servicesCountry delete guard). This minimal schema exists so those imports
 * resolve and the server boots; queries simply return empty results until the
 * real Service module is restored.
 *
 * Fields below mirror only what dependent code references.
 */
const serviceSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    // Referenced as `status: "active"` in sitemap.service.ts
    status: {
      type: String,
      default: "active",
    },
    // Referenced by servicesCountry delete guard
    servicesCountry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicesCountry",
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Service = model("Service", serviceSchema);
