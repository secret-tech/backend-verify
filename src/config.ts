const {
	REDIS_HOST,
	REDIS_PORT,
	REDIS_DATABASE,
	PORT,
	HTTPS_PORT,
	HTTPS_SERVER,
	FORCE_HTTPS,
	AUTH_JWT_KEY
} = process.env

export default {
	server: {
		port: parseInt(PORT, 10) || 3000,
		httpsPort: parseInt(HTTPS_PORT, 10) || 4000,
		httpsServer: HTTPS_SERVER || 'disabled',
		forceHttps: FORCE_HTTPS || 'disabled'
	},
	jwt: {
		algorithm: 'HS256',
		secret_separator: ':',
		expiration: 604800,
		secret: AUTH_JWT_KEY || '%WBS#7LFaI@yY3EYapF$p3oZeLGnYeeyq0XdD$!pu9HtOw8#soxiVe'
	},
	redis: {
		port: parseInt(REDIS_PORT, 10) || 6379,
		host: REDIS_HOST || 'localhost',
		database: REDIS_DATABASE || 0,
		prefix: 'jincor_verify_'
	}
}
