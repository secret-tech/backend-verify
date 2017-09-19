const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_DATABASE,
  PORT,
  HTTPS_PORT,
  HTTPS_SERVER,
  FORCE_HTTPS,
  AUTH_API_URL
} = process.env

export default {
  server: {
    port: parseInt(PORT, 10) || 3001,
    httpsPort: parseInt(HTTPS_PORT, 10) || 4001,
    httpsServer: HTTPS_SERVER || 'disabled',
    forceHttps: FORCE_HTTPS || 'disabled'
  },
  auth: {
    url: AUTH_API_URL || 'http://auth:3000/tenant/verify'
  },
  redis: {
    port: parseInt(REDIS_PORT, 10) || 6379,
    host: REDIS_HOST || 'localhost',
    database: REDIS_DATABASE || 0,
    prefix: 'jincor_verify_'
  },
  providers: {
    email: {
      provider: process.env.EMAIL_DRIVER
    }
  }
}
