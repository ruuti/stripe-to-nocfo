import { StripeService, NocfoService } from '../services';
import { TransactionProcessor, MainProcessor } from '../processors';
import {
  mockStripeTransactions,
  mockStripeRefund,
  mockStripeCharge,
} from './mocks/stripe-mocks';
import { mockNocfoEntries } from './mocks/nocfo-mocks';
import { Config } from '../types';

// Mock the services
jest.mock('../services/stripe');
jest.mock('../services/nocfo');

describe('Integration Tests', () => {
  let mockStripeService: jest.Mocked<StripeService>;
  let mockNocfoService: jest.Mocked<NocfoService>;
  let transactionProcessor: TransactionProcessor;
  let mainProcessor: MainProcessor;

  const mockConfig: Config = {
    STRIPE: {
      SECRET_KEY: 'sk_test_mock',
    },
    NOCFO: {
      BASE_URL: 'https://api-prd.nocfo.io/v1',
      BUSINESS_ID: 'test_business_id',
      AUTH_TOKEN: 'test_auth_token',
      CSRF_TOKEN: 'test_csrf_token',
    },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mocked service instances
    mockStripeService = new StripeService(
      mockConfig
    ) as jest.Mocked<StripeService>;
    mockNocfoService = new NocfoService(
      mockConfig
    ) as jest.Mocked<NocfoService>;

    // Mock the service methods
    mockStripeService.loadTransactions = jest
      .fn()
      .mockResolvedValue(mockStripeTransactions);
    mockStripeService.getRefund = jest.fn().mockResolvedValue(mockStripeRefund);
    mockStripeService.getCharge = jest.fn().mockResolvedValue(mockStripeCharge);

    mockNocfoService.loadEntries = jest
      .fn()
      .mockResolvedValue(mockNocfoEntries);
    mockNocfoService.createEntry = jest
      .fn()
      .mockResolvedValue({ id: 'new_entry_id' });
    mockNocfoService.updateEntry = jest
      .fn()
      .mockResolvedValue({ id: 'updated_entry_id' });
    mockNocfoService.findExistingEntry = jest
      .fn()
      .mockImplementation((transactionId: string, entries: any[]) => {
        return entries.find(entry =>
          entry.description.startsWith(transactionId)
        );
      });
    mockNocfoService.isEntryUnchanged = jest.fn().mockReturnValue(false);

    // Create processor instances
    transactionProcessor = new TransactionProcessor(mockStripeService);
    mainProcessor = new MainProcessor(mockNocfoService, transactionProcessor);
  });

  describe('Transaction Processing', () => {
    it('should process payment transactions and create NOCFO entries', async () => {
      // Arrange
      const paymentTransaction = mockStripeTransactions[0]!; // Payment transaction
      const nocfoEntries: any[] = []; // Empty NOCFO entries

      // Act
      const result = await mainProcessor.processTransactions(
        [paymentTransaction],
        nocfoEntries
      );

      // Assert
      expect(result.totalStripeTransactions).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      // Verify service calls
      expect(mockNocfoService.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          blueprint_type: 'SALES',
          description: 'txn_1234567890 - Stripe Transaction',
        })
      );
    });

    it('should process Stripe fee transactions', async () => {
      // Arrange
      const feeTransaction = mockStripeTransactions[1]!; // Stripe fee transaction
      const nocfoEntries: any[] = [];

      // Act
      const result = await mainProcessor.processTransactions(
        [feeTransaction],
        nocfoEntries
      );

      // Assert
      expect(result.totalStripeTransactions).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      // Verify service calls
      expect(mockNocfoService.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          blueprint_type: 'PURCHASE',
          description: 'txn_0987654321 - Stripe fee',
        })
      );
    });

    it('should process refund transactions', async () => {
      // Arrange
      const refundTransaction = mockStripeTransactions[2]!; // Refund transaction
      const nocfoEntries = mockNocfoEntries; // Include existing entries for refund lookup

      // Act
      const result = await mainProcessor.processTransactions(
        [refundTransaction],
        nocfoEntries
      );

      // Assert
      expect(result.totalStripeTransactions).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      // Verify Stripe service calls for refund processing
      expect(mockStripeService.getRefund).toHaveBeenCalledWith('re_1234567890');
      expect(mockStripeService.getCharge).toHaveBeenCalledWith('ch_1234567890');

      // Verify NOCFO service calls
      expect(mockNocfoService.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          blueprint_type: 'MANUAL',
          description: expect.stringContaining('txn_refund_123'),
        })
      );
    });

    it('should skip unchanged entries', async () => {
      // Arrange
      const paymentTransaction = mockStripeTransactions[0]!;
      const nocfoEntries = mockNocfoEntries;

      // Mock that the entry is unchanged
      mockNocfoService.isEntryUnchanged = jest.fn().mockReturnValue(true);

      // Act
      const result = await mainProcessor.processTransactions(
        [paymentTransaction],
        nocfoEntries
      );

      // Assert
      expect(result.totalStripeTransactions).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      // Verify no create/update calls were made
      expect(mockNocfoService.createEntry).not.toHaveBeenCalled();
      expect(mockNocfoService.updateEntry).not.toHaveBeenCalled();
    });

    it('should update changed entries', async () => {
      // Arrange
      const paymentTransaction = mockStripeTransactions[0]!;
      const nocfoEntries = mockNocfoEntries;

      // Mock that the entry exists but is changed
      mockNocfoService.findExistingEntry = jest
        .fn()
        .mockReturnValue(mockNocfoEntries[0]);
      mockNocfoService.isEntryUnchanged = jest.fn().mockReturnValue(false);

      // Act
      const result = await mainProcessor.processTransactions(
        [paymentTransaction],
        nocfoEntries
      );

      // Assert
      expect(result.totalStripeTransactions).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);

      // Verify update call was made
      expect(mockNocfoService.updateEntry).toHaveBeenCalledWith(
        'nocfo_entry_1',
        expect.objectContaining({
          blueprint_type: 'SALES',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const paymentTransaction = mockStripeTransactions[0]!;
      const nocfoEntries: any[] = [];

      // Mock service to throw error
      mockNocfoService.createEntry = jest
        .fn()
        .mockRejectedValue(new Error('API Error'));

      // Act
      const result = await mainProcessor.processTransactions(
        [paymentTransaction],
        nocfoEntries
      );

      // Assert
      expect(result.totalStripeTransactions).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.errorReasons).toHaveLength(1);
      expect(result.errorReasons[0]).toContain('Failed to create entry');
    });
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
      expect(entry.blueprint.credit_entries).toHaveLength(1);
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
      expect(entry.blueprint.debet_entries).toHaveLength(1);
      expect(entry.blueprint.debet_entries![0]!.amount).toBe(2.9);
    });

    it('should create refund entry correctly', async () => {
      // Arrange
      const refundTransaction = mockStripeTransactions[2]!;
      const nocfoEntries = mockNocfoEntries;

      // Act
      const entry = await transactionProcessor.createRefundEntry(
        refundTransaction,
        nocfoEntries
      );

      // Assert
      expect(entry.blueprint_type).toBe('MANUAL');
      expect(entry.description).toContain('txn_refund_123');
      expect(entry.blueprint.debet_entries).toHaveLength(3);
      expect(entry.blueprint.credit_entries).toHaveLength(1);
    });
  });
});
