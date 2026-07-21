export interface ICaseStudyCategory {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "inactive";
  is_deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
