export interface IContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface IQuotationRequest {
  name: string;
  email: string;
  phone?: string;
  site_url?: string;
  company_name?: string;
  delivery_time?: string;
  start_date?: string;
  service: string;
  budget: string;
  message: string;
  help?: string;
}
