export default () => ({
  port: process.env.PORT,
  frontendUrl: process.env.FRONTEND_URL,
  node: {
    env: process.env.NODE_ENV,
  },
  database: {
    port: process.env.PORT_DATABASE,
    password: process.env.PASSWORD_DATABASE,
    username: process.env.USERNAME_DATABASE,
    host: process.env.HOST_DATABASE,
    nameDatabase: process.env.NAME_DATABASE,
    synchronize: process.env.SYNCHRONIZE_DATABASE,
  },
  jwt: {
    privateKey: process.env.PRIVATE_KEY_JWT,
    publicKey: process.env.PUBLIC_KEY_JWT,
  },
  smtp: {
    user: process.env.USER_SMTP,
    pass: process.env.PASS_SMTP,
  },
  chipher: {
    secret: process.env.SECRET_CHIPHER,
  },
  throttler: {
    ttl: process.env.TTL_THROTTLER,
    limit: process.env.LIMIT_THROTTLER,
  },
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
  },
});
