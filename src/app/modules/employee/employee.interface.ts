import { Types } from "mongoose";

export interface ICreateEmployee {
  name: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  profilePhoto?: string;
  roleId: Types.ObjectId | string;
  designationId?: Types.ObjectId | string;
}

export interface IUpdateEmployee {
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  profilePhoto?: string;
  roleId?: Types.ObjectId | string;
  designationId?: Types.ObjectId | string;
  isActive?: boolean;
}
