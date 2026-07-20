export interface IShippingMethod {
  title: string;
  description?: string;
  price: number;
  slNumber?: number;
  isDefault?: boolean;
  isActive?: boolean;
}
