import { UserRole } from "../modules/user/user.interface";

export interface AuthedSocketData {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}
