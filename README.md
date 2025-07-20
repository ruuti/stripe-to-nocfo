# NOCFO Stripe Sync

A Node.js application that synchronizes Stripe balance transactions to the NOCFO accounting system. This tool automatically creates, updates, and manages accounting entries in NOCFO based on Stripe transaction data.

Handles payments, charges, Stripe fees, and refunds

⚠️ **Important Note**: This application uses the undocumented NOCFO API which may change at any time without notice. Use at your own risk and be prepared to update the code if the API changes.

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...

# NOCFO Configuration
NOCFO_BUSINESS_ID=your_business_id
NOCFO_AUTH_TOKEN=your_auth_token
NOCFO_CSRF_TOKEN=your_csrf_token
```

## Configuration

### Environment Variables

| Variable            | Description                     | Required |
| ------------------- | ------------------------------- | -------- |
| `STRIPE_SECRET_KEY` | Your Stripe secret key          | ✅       |
| `NOCFO_BUSINESS_ID` | Your NOCFO business ID          | ✅       |
| `NOCFO_AUTH_TOKEN`  | Your NOCFO authentication token | ✅       |
| `NOCFO_CSRF_TOKEN`  | Your NOCFO CSRF token           | ✅       |

### Account Configuration

The application uses hardcoded account IDs for different transaction types:

- **Sales Account**: `4971114` (VAT rate: 25.5%)
- **Bank Account**: `4982339`
- **Stripe Fee Account**: `4971314`
- **VAT Account**: `4971086`
- **Refund Account**: `4971222`

## Usage

### Development

Run the application in development mode:

```bash
npm run dev
```

### Production

Build and run the application:

```bash
npm run build
npm start
```

### Scripts

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Run in development mode with hot reload |
| `npm run build`         | Build the TypeScript project            |
| `npm start`             | Run the built application               |
| `npm run clean`         | Clean build artifacts                   |
| `npm test`              | Run tests                               |
| `npm run test:watch`    | Run tests in watch mode                 |
| `npm run test:coverage` | Run tests with coverage report          |
| `npm run format`        | Format all code with Prettier           |
| `npm run format:check`  | Check if code is properly formatted     |
| `npm run lint`          | Run ESLint to check code quality        |
| `npm run lint:fix`      | Run ESLint and auto-fix issues          |

## Testing

The project includes comprehensive tests with Jest and TypeScript:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```
