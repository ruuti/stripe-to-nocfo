export interface ResultsSummary {
  totalStripeTransactions: number;
  created: number;
  updated: number;
  skipped: number;
  skippedReasons: string[];
  errors: number;
  errorReasons: string[];
}
