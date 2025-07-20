import Stripe from 'stripe';
import { NocfoEntry, NocfoEntryInput, ResultsSummary } from '../types';
import { NocfoService } from '../services';
import { TransactionProcessor } from './transaction-processor';
import logger from '../utils/logger';

export class MainProcessor {
  private nocfoService: NocfoService;
  private transactionProcessor: TransactionProcessor;

  constructor(
    nocfoService: NocfoService,
    transactionProcessor: TransactionProcessor
  ) {
    this.nocfoService = nocfoService;
    this.transactionProcessor = transactionProcessor;
  }

  async processTransactions(
    transactions: Stripe.BalanceTransaction[],
    nocfoEntries: NocfoEntry[]
  ): Promise<ResultsSummary> {
    const resultsSummary: ResultsSummary = {
      totalStripeTransactions: transactions.length,
      created: 0,
      updated: 0,
      skipped: 0,
      skippedReasons: [],
      errors: 0,
      errorReasons: [],
    };

    const transactionsToCreate = [...transactions.reverse()];

    for (const transaction of transactionsToCreate) {
      let entry: NocfoEntryInput | null = null;
      try {
        entry = await this.transactionProcessor.createEntryFromTransaction(
          transaction,
          nocfoEntries
        );
      } catch (error: unknown) {
        logger.error(`Error processing transaction ${transaction.id}:`, error);

        if (error instanceof Error) {
          resultsSummary.errorReasons.push(
            `Error processing transaction ${transaction.id}: ${error.message}`
          );
        } else {
          resultsSummary.errorReasons.push(
            `Error processing transaction ${transaction.id}: Unknown error`
          );
        }

        resultsSummary.errors++;
        continue;
      }

      if (!entry) {
        resultsSummary.skipped++;
        resultsSummary.skippedReasons.push(
          `Transaction ${transaction.id} of type ${transaction.type} is not handled.`
        );
        logger.info(
          `Skipping transaction ${transaction.id} of type ${transaction.type}`
        );
        continue;
      }

      if (entry) {
        // Check if entry already exists
        // split description by ' - ' and use the first part to find existing entries
        const existingEntry = this.nocfoService.findExistingEntry(
          transaction.id,
          nocfoEntries
        );
        if (existingEntry) {
          if (this.nocfoService.isEntryUnchanged(existingEntry, entry)) {
            logger.info(
              `Entry for transaction ${transaction.id} already exists and is unchanged.`
            );
            continue;
          }
          try {
            await this.nocfoService.updateEntry(existingEntry.id, entry);
            resultsSummary.updated++;
            logger.info(
              `Successfully updated entry for transaction ${transaction.id}`
            );
          } catch (error: unknown) {
            logger.error(
              `Failed to update entry for transaction ${transaction.id}:`,
              error
            );
            if (error instanceof Error) {
              resultsSummary.errorReasons.push(
                `Failed to update entry for transaction ${transaction.id}: ${error.message}`
              );
            } else {
              resultsSummary.errorReasons.push(
                `Failed to update entry for transaction ${transaction.id}: Unknown error`
              );
            }
            resultsSummary.errors++;
            continue;
          }
        } else {
          try {
            await this.nocfoService.createEntry(entry);
            resultsSummary.created++;
            logger.info(
              `Successfully created entry for transaction ${transaction.id}`
            );
          } catch (error: unknown) {
            logger.error(
              `Failed to update entry for transaction ${transaction.id}:`,
              error
            );
            if (error instanceof Error) {
              resultsSummary.errorReasons.push(
                `Failed to create entry for transaction ${transaction.id}: ${error.message}`
              );
            } else {
              resultsSummary.errorReasons.push(
                `Failed to create entry for transaction ${transaction.id}: Unknown error`
              );
            }
            resultsSummary.errors++;
            continue;
          }
        }
      }
    }

    return resultsSummary;
  }
}
