import { Schema, model } from "mongoose";
import { ITeamMemberContact } from "./teamMemberContact.interface";

const teamMemberContactSchema = new Schema<ITeamMemberContact>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      // ref must match the registered Mongoose model name, which is kept as
      // "TimeMember" to preserve the existing MongoDB collection.
      ref: "TimeMember",
      required: true,
    },
  },
  { timestamps: true }
);

// Keep the Mongoose model name as "TimeMemberContact" so the existing
// MongoDB collection ("timemembercontacts") continues to be used.
const TeamMemberContact = model<ITeamMemberContact>(
  "TimeMemberContact",
  teamMemberContactSchema
);

export default TeamMemberContact;
