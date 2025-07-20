import 'dotenv/config';
import { Config } from './types';
import { StripeService, NocfoService } from './services';
import { TransactionProcessor, MainProcessor } from './processors';
import logger from './utils/logger';

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'NOCFO_BUSINESS_ID',
  'NOCFO_AUTH_TOKEN',
  'NOCFO_CSRF_TOKEN',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configuration
const CONFIG: Config = {
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  },
  NOCFO: {
    BASE_URL: 'https://api-prd.nocfo.io/v1',
    BUSINESS_ID: process.env.NOCFO_BUSINESS_ID!,
    AUTH_TOKEN: process.env.NOCFO_AUTH_TOKEN!,
    CSRF_TOKEN: process.env.NOCFO_CSRF_TOKEN!,
  },
};

// Initialize services and processors
const stripeService = new StripeService(CONFIG);
const nocfoService = new NocfoService(CONFIG);
const transactionProcessor = new TransactionProcessor(stripeService);
const mainProcessor = new MainProcessor(nocfoService, transactionProcessor);

(async () => {
  try {
    // Load all data concurrently
    logger.info('Loading Stripe transactions and NOCFO entries...');
    const [transactions, nocfoEntries] = await Promise.all([
      stripeService.loadTransactions(),
      nocfoService.loadEntries(),
    ]);

    logger.info(
      `Loaded ${transactions.length} Stripe transactions and ${nocfoEntries.length} NOCFO entries`
    );

    // Process transactions
    const resultsSummary = await mainProcessor.processTransactions(
      transactions,
      nocfoEntries
    );

    logger.info('Processing complete:', resultsSummary);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Fatal error:', error.message);
    } else {
      logger.error('Fatal error:', error);
    }
    process.exit(1);
  }
})();
