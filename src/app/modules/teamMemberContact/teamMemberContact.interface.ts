import { Types } from "mongoose";

export interface ITeamMemberContact {
  phone: string;
  question: string;
  memberId: Types.ObjectId;
}