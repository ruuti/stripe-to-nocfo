import Stripe from 'stripe';
import { NocfoEntry, NocfoEntryInput } from '../types';
import { StripeService } from '../services';

export class TransactionProcessor {
  private stripeService: StripeService;

  constructor(stripeService: StripeService) {
    this.stripeService = stripeService;
  }

  createPaymentEntry(transaction: Stripe.BalanceTransaction): NocfoEntryInput {
    return {
      blueprint_type: 'SALES',
      contact_id: null,
      blueprint: {
        debet_account_id: 4982339,
        credit_entries: [
          {
            account_id: 4971114,
            vat_code: 1,
            vat_rate: 25.5,
            amount: transaction.amount / 100,
          },
        ],
        expense_entries: transaction.fee_details
          .filter(({ type }) => type === 'stripe_fee')
          .map(fee => ({
            account_id: 4971314,
            vat_code: 3,
            vat_rate: 0,
            amount: fee.amount / 100,
          })),
      },
      attachment_ids: [],
      date: new Date(transaction.created * 1000).toISOString().split('T')[0]!,
      description: `${transaction.id} - Stripe Transaction`,
    };
  }

  createStripeFeeEntry(
    transaction: Stripe.BalanceTransaction
  ): NocfoEntryInput {
    return {
      blueprint_type: 'PURCHASE',
      contact_id: null,
      blueprint: {
        credit_account_id: 4982339,
        debet_entries: [
          {
            account_id: 4971314,
            vat_code: 3,
            vat_rate: 0,
            amount: transaction.amount / -100,
          },
        ],
      },
      attachment_ids: [],
      date: new Date(transaction.created * 1000).toISOString().split('T')[0]!,
      description: `${transaction.id} - ${transaction.description}`,
    };
  }

  async createRefundEntry(
    transaction: Stripe.BalanceTransaction,
    nocfoEntries: NocfoEntry[]
  ): Promise<NocfoEntryInput> {
    if (!transaction.source || typeof transaction.source !== 'string') {
      throw new Error(
        `Invalid transaction source for refund ${transaction.id}`
      );
    }

    const refund = await this.stripeService.getRefund(transaction.source);
    if (!refund.charge || typeof refund.charge !== 'string') {
      throw new Error(`Invalid charge reference for refund ${transaction.id}`);
    }

    const charge = await this.stripeService.getCharge(refund.charge);
    const originalBalanceTxnId = charge.balance_transaction;

    const originalEntry = nocfoEntries.find(
      e => e.description.split(' - ')[0] === originalBalanceTxnId
    );
    if (!originalEntry) {
      throw new Error(
        `No original entry found for refund transaction ${transaction.id}`
      );
    }

    const cEntry = originalEntry.blueprint.credit_entries.find(
      e => e.account_id == 4971114
    );
    if (!cEntry) {
      throw new Error(
        `No credit entry found for original transaction ${originalBalanceTxnId}`
      );
    }

    const vRate = cEntry.vat_rate / 100;
    const vat = parseFloat(((cEntry.amount / (vRate + 1)) * vRate).toFixed(2)); // 34.8 / 1.255 * 0.255; // = ~ 7.07091633466

    return {
      blueprint_type: 'MANUAL',
      contact_id: null,
      blueprint: {
        debet_entries: [
          {
            defaultEntryData: {
              account_id: null,
              amount: 0,
              description: null,
              vat_code: 0,
              vat_rate: 0,
            },
            account_id: 4971114,
            vat_code: 1,
            vat_rate: 0,
            amount: cEntry.amount - vat,
          },
          {
            account_id: 4971086,
            amount: vat,
            description: null,
            vat_code: 3,
            vat_rate: 0,
          },
          {
            account_id: 4971222,
            amount: transaction.amount / -100 - cEntry.amount,
            description: null,
            vat_code: 3,
            vat_rate: 0,
          },
        ],
        credit_entries: [
          {
            amount: transaction.amount / -100,
            account_id: 4982339,
            vat_code: 3,
            vat_rate: 0,
          },
        ],
      },
      attachment_ids: [],
      date: new Date(transaction.created * 1000).toISOString().split('T')[0]!,
      description: `${transaction.id} - ${transaction.description} ${originalBalanceTxnId}`,
    };
  }

  async createEntryFromTransaction(
    transaction: Stripe.BalanceTransaction,
    nocfoEntries: NocfoEntry[]
  ): Promise<NocfoEntryInput | null> {
    if (transaction.type === 'payment' || transaction.type === 'charge') {
      return this.createPaymentEntry(transaction);
    } else if (transaction.type === 'stripe_fee') {
      return this.createStripeFeeEntry(transaction);
    } else if (transaction.type === 'refund') {
      return this.createRefundEntry(transaction, nocfoEntries);
    } else {
      return null; // Unhandled transaction type
    }
  }
}
