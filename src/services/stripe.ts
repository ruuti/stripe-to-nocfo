import Stripe from 'stripe';
import { Config } from '../types';

export class StripeService {
  private stripe: Stripe;

  constructor(config: Config) {
    this.stripe = new Stripe(config.STRIPE.SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
  }

  async loadTransactions(): Promise<Stripe.BalanceTransaction[]> {
    const transactions: Stripe.BalanceTransaction[] = [];
    let hasMoreTransactions = true;

    while (hasMoreTransactions) {
      const params: Stripe.BalanceTransactionListParams = {
        limit: 100,
      };
      if (transactions.length > 0) {
        const lastTxn = transactions[transactions.length - 1];
        if (lastTxn?.id) {
          params.starting_after = lastTxn.id;
        }
      }
      const s = await this.stripe.balanceTransactions.list(params);
      transactions.push(...s.data);
      hasMoreTransactions = s.has_more === true;
    }
    return transactions;
  }

  async getRefund(refundId: string): Promise<Stripe.Refund> {
    return await this.stripe.refunds.retrieve(refundId);
  }

  async getCharge(chargeId: string): Promise<Stripe.Charge> {
    return await this.stripe.charges.retrieve(chargeId);
  }
}
