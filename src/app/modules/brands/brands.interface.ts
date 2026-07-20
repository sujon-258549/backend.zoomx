export interface IBrands extends Document {
  name: string;
  description: string;
  logo: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
}
