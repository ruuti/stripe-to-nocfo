export interface Config {
  STRIPE: {
    SECRET_KEY: string;
  };
  NOCFO: {
    BASE_URL: string;
    BUSINESS_ID: string;
    AUTH_TOKEN: string;
    CSRF_TOKEN: string;
  };
}
