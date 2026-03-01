export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://pigbit:pigbit@localhost:5432/pigbit',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  nowpayments: {
    apiUrl: process.env.NOWPAYMENTS_API_URL || 'https://api-sandbox.nowpayments.io/v1',
    useSandbox: process.env.NOWPAYMENTS_USE_SANDBOX === 'true',
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || process.env.GMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.GMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@pigbit.com',
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
});
