export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Person {
  document: string;
  documentType: string;
  name: string;
  surname: string;
  email: string;
  mobile?: string;
  company?: string;
  address?: Address;

  [key: string]: unknown;
}
