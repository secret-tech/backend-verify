const {
  REDIS_URL,
  PORT,
  HTTPS_PORT,
  HTTPS_SERVER,
  FORCE_HTTPS,
  AUTH_API_URL,
  AUTH_API_TIMEOUT
} = process.env;

export default {
  environment: {
    isTesting: process.env.LOADED_MOCHA_OPTS === 'true'
  },
  server: {
    port: parseInt(PORT, 10) || 3000,
    httpsPort: parseInt(HTTPS_PORT, 10) || 4000,
    httpsServer: HTTPS_SERVER || 'disabled',
    forceHttps: FORCE_HTTPS || 'disabled'
  },
  auth: {
    url: AUTH_API_URL || 'http://auth:3000/tenant/verify',
    timeout: parseInt(AUTH_API_TIMEOUT, 10) || 5000
  },
  redis: {
    url: REDIS_URL || 'redis://redis:6379',
    prefix: 'jincor_verify_'
  },
  providers: {
    email: {
      provider: process.env.MAIL_DRIVER || 'dummy'
    }
  }
};
