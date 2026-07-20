export interface ITeamMemberSocialLink {
  name?: string;
  link?: string;
}

export interface ITeamMember {
  name: string;
  email?: string;
  phone?: string;
  designation: string;
  department?: string;
  photoId?: string;
  bio?: string;
  serial_no: number;
  socialLinks?: ITeamMemberSocialLink[];
  is_new: boolean;
  isActive: boolean;
  isTeamLead: boolean;
}
