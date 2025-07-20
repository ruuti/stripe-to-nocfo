export interface NocfoEntry {
  id: string;
  description: string;
  blueprint: {
    credit_entries: Array<{
      account_id: number;
      vat_code: number;
      vat_rate: number;
      vat_method?: number;
      amount: number;
      description?: string | null;
    }>;
    debet_entries?: Array<{
      account_id: number;
      vat_code: number;
      vat_rate: number;
      vat_method?: number;
      amount: number;
      defaultEntryData?: {
        account_id: number | null;
        amount: number;
        description: string | null;
        vat_code: number;
        vat_rate: number;
      };
      description?: string | null;
    }>;
    expense_entries?: Array<{
      account_id: number;
      vat_code: number;
      vat_rate: number;
      amount: number;
    }>;
  };
  attachment_ids: string[];
  date: string;
}

export interface NocfoEntryInput {
  blueprint_type: string;
  contact_id: null;
  blueprint: {
    debet_account_id?: number;
    credit_account_id?: number;
    credit_entries?: Array<{
      account_id: number;
      vat_code: number;
      vat_rate: number;
      vat_method?: number;
      amount: number;
      description?: string | null;
    }>;
    debet_entries?: Array<{
      account_id: number;
      vat_code: number;
      vat_rate: number;
      vat_method?: number;
      amount: number;
      defaultEntryData?: {
        account_id: number | null;
        amount: number;
        description: string | null;
        vat_code: number;
        vat_rate: number;
      };
      description?: string | null;
    }>;
    expense_entries?: Array<{
      account_id: number;
      vat_code: number;
      vat_rate: number;
      amount: number;
    }>;
  };
  attachment_ids: string[];
  date: string;
  description: string;
}

export interface NocfoApiResponse {
  results: NocfoEntry[];
  next?: string;
}
