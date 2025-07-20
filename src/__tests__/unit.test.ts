import { TransactionProcessor } from '../processors';
import { mockStripeTransactions } from './mocks/stripe-mocks';
import { mockNocfoEntries } from './mocks/nocfo-mocks';

// Mock the StripeService
const mockStripeService = {
  getRefund: jest.fn(),
  getCharge: jest.fn(),
} as any;

describe('Unit Tests', () => {
  let transactionProcessor: TransactionProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionProcessor = new TransactionProcessor(mockStripeService);
  });

  describe('Transaction Processor', () => {
    it('should create payment entry correctly', () => {
      // Arrange
      const paymentTransaction = mockStripeTransactions[0]!;

      // Act
      const entry = transactionProcessor.createPaymentEntry(paymentTransaction);

      // Assert
      expect(entry.blueprint_type).toBe('SALES');
      expect(entry.description).toBe('txn_1234567890 - Stripe Transaction');
      expect(entry.blueprint.credit_entries).toBeDefined();
      expect(entry.blueprint.credit_entries!.length).toBe(1);
      expect(entry.blueprint.credit_entries![0]!.amount).toBe(34.8);
      expect(entry.blueprint.credit_entries![0]!.vat_rate).toBe(25.5);
    });

    it('should create Stripe fee entry correctly', () => {
      // Arrange
      const feeTransaction = mockStripeTransactions[1]!;

      // Act
      const entry = transactionProcessor.createStripeFeeEntry(feeTransaction);

      // Assert
      expect(entry.blueprint_type).toBe('PURCHASE');
      expect(entry.description).toBe('txn_0987654321 - Stripe fee');
      expect(entry.blueprint.debet_entries).toBeDefined();
      expect(entry.blueprint.debet_entries!.length).toBe(1);
      expect(entry.blueprint.debet_entries![0]!.amount).toBe(2.9);
    });

    it('should create refund entry correctly', async () => {
      // Arrange
      const refundTransaction = mockStripeTransactions[2]!;
      const nocfoEntries = mockNocfoEntries;

      // Mock the Stripe service calls
      mockStripeService.getRefund = jest.fn().mockResolvedValue({
        id: 're_1234567890',
        charge: 'ch_1234567890',
      });
      mockStripeService.getCharge = jest.fn().mockResolvedValue({
        id: 'ch_1234567890',
        balance_transaction: 'txn_1234567890',
      });

      // Act
      const entry = await transactionProcessor.createRefundEntry(
        refundTransaction,
        nocfoEntries
      );

      // Assert
      expect(entry.blueprint_type).toBe('MANUAL');
      expect(entry.description).toContain('txn_refund_123');
      expect(entry.blueprint.debet_entries).toBeDefined();
      expect(entry.blueprint.debet_entries!.length).toBe(3);
      expect(entry.blueprint.credit_entries).toBeDefined();
      expect(entry.blueprint.credit_entries!.length).toBe(1);
    });

    it('should handle unknown transaction types', async () => {
      // Arrange
      const unknownTransaction = {
        ...mockStripeTransactions[0]!,
        type: 'payout' as any,
      };

      // Act
      const entry = await transactionProcessor.createEntryFromTransaction(
        unknownTransaction,
        []
      );

      // Assert
      expect(entry).toBeNull();
    });
  });

  describe('Mock Data Validation', () => {
    it('should have valid Stripe mock data', () => {
      expect(mockStripeTransactions).toHaveLength(3);
      expect(mockStripeTransactions[0]!.type).toBe('payment');
      expect(mockStripeTransactions[1]!.type).toBe('stripe_fee');
      expect(mockStripeTransactions[2]!.type).toBe('refund');
    });

    it('should have valid NOCFO mock data', () => {
      expect(mockNocfoEntries).toHaveLength(2);
      expect(mockNocfoEntries[0]!.description).toContain('txn_1234567890');
      expect(mockNocfoEntries[1]!.description).toContain('txn_0987654321');
    });
  });
});
