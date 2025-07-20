import { NocfoEntry, NocfoApiResponse } from '../../types';

export const mockNocfoEntries: NocfoEntry[] = [
  {
    id: 'nocfo_entry_1',
    description: 'txn_1234567890 - Stripe Transaction',
    blueprint: {
      credit_entries: [
        {
          account_id: 4971114,
          vat_code: 1,
          vat_rate: 25.5,
          amount: 34.8,
        },
      ],
      expense_entries: [
        {
          account_id: 4971314,
          vat_code: 3,
          vat_rate: 0,
          amount: 2.9,
        },
      ],
    },
    attachment_ids: [],
    date: '2022-01-01',
  },
  {
    id: 'nocfo_entry_2',
    description: 'txn_0987654321 - Stripe fee',
    blueprint: {
      credit_entries: [],
      debet_entries: [
        {
          account_id: 4971314,
          vat_code: 3,
          vat_rate: 0,
          amount: 2.9,
        },
      ],
    },
    attachment_ids: [],
    date: '2022-01-01',
  },
];

export const mockNocfoApiResponse: NocfoApiResponse = {
  results: mockNocfoEntries,
};
