// Test setup file
import 'dotenv/config';

// Mock environment variables for testing
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.NOCFO_BUSINESS_ID = 'test_business_id';
process.env.NOCFO_AUTH_TOKEN = 'test_auth_token';
process.env.NOCFO_CSRF_TOKEN = 'test_csrf_token';
process.env.NODE_ENV = 'test';

// Mock the logger to suppress console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
