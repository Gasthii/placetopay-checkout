export interface Amount {
  currency: string;
  total: number;

  taxes?: Array<{
    kind?: string;
    amount?: number;
    base?: number;
  }>;

  details?: Array<{
    kind?: string;
    amount?: number;
  }>;

  [key: string]: unknown;
}
