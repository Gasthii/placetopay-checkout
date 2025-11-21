export interface Person {
  document?: string;
  documentType?: string;
  name?: string;
  surname?: string;
  company?: string;
  email?: string;
  mobile?: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
  };

  [key: string]: unknown;
}
