import { Schema, model } from "mongoose";
import { ITeamMember } from "./teamMember.interface";

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    photoId: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    serial_no: {
      type: Number,
      required: true,
      min: 1,
    },
    socialLinks: {
      type: [
        {
          _id: false,
          name: { type: String, trim: true },
          link: { type: String, trim: true },
        },
      ],
      default: [],
    },
    is_new: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isTeamLead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Keep the Mongoose model name as "TimeMember" so the existing MongoDB
// collection ("timemembers") continues to be used. Renaming the model name
// would silently start writing to a new empty "teammembers" collection and
// orphan the existing data.
const TeamMember = model<ITeamMember>("TimeMember", teamMemberSchema);

export default TeamMember;
