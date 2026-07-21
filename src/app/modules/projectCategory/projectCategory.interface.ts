export interface IProjectCategory {
  _id?: string;
  name: string;
  slug: string;
  aspect: "16/9" | "9/16";
  cols: number;
  status: "active" | "inactive";
  is_deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
