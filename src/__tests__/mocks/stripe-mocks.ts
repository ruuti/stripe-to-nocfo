import Stripe from 'stripe';

export const mockStripeTransactions: Stripe.BalanceTransaction[] = [
  {
    id: 'txn_1234567890',
    object: 'balance_transaction',
    amount: 3480, // 34.80 EUR
    currency: 'eur',
    description: 'Payment from customer',
    fee: 290, // 2.90 EUR fee
    fee_details: [
      {
        amount: 290,
        currency: 'eur',
        type: 'stripe_fee',
        application: null,
        description: 'Stripe fee',
      },
    ],
    net: 3190, // 31.90 EUR net
    status: 'available',
    type: 'payment',
    created: 1640995200, // 2022-01-01
    available_on: 1640995200,
    exchange_rate: null,
    reporting_category: 'charge',
    source: 'ch_1234567890',
    balance_type: 'available' as Stripe.BalanceTransaction.BalanceType,
  },
  {
    id: 'txn_0987654321',
    object: 'balance_transaction',
    amount: -290, // -2.90 EUR (negative for fee)
    currency: 'eur',
    description: 'Stripe fee',
    fee: 0,
    fee_details: [],
    net: -290,
    status: 'available',
    type: 'stripe_fee',
    created: 1640995200,
    available_on: 1640995200,
    exchange_rate: null,
    reporting_category: 'stripe_fee',
    source: 'ch_1234567890',
    balance_type: 'available' as Stripe.BalanceTransaction.BalanceType,
  },
  {
    id: 'txn_refund_123',
    object: 'balance_transaction',
    amount: -3480, // -34.80 EUR (negative for refund)
    currency: 'eur',
    description: 'Refund to customer',
    fee: 0,
    fee_details: [],
    net: -3480,
    status: 'available',
    type: 'refund',
    created: 1641081600, // 2022-01-02
    available_on: 1641081600,
    exchange_rate: null,
    reporting_category: 'refund',
    source: 're_1234567890',
    balance_type: 'available' as Stripe.BalanceTransaction.BalanceType,
  },
];

export const mockStripeRefund: Stripe.Refund = {
  id: 're_1234567890',
  object: 'refund',
  amount: 3480,
  currency: 'eur',
  charge: 'ch_1234567890',
  created: 1641081600,
  metadata: {},
  reason: 'requested_by_customer',
  receipt_number: null,
  status: 'succeeded',
} as Stripe.Refund;

export const mockStripeCharge: Stripe.Charge = {
  id: 'ch_1234567890',
  object: 'charge',
  amount: 3480,
  currency: 'eur',
  balance_transaction: 'txn_1234567890',
  created: 1640995200,
  metadata: {},
  status: 'succeeded',
} as Stripe.Charge;
