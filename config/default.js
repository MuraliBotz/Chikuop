module.exports = {
  host: 'localhost',
  port: 5050,
  public: '../public/',
  paginate: {
    default: 10,
    max: 50
  },
  authentication: {
    oauth: {
      redirect: 'EXTERNAL_URL',
      github: {
        key: 'GITHUB_CLIENT_ID',
        secret: 'GITHUB_CLIENT_SECRET',
        scope: [
          'user:email'
        ],
      },
    },
    entity: 'user',
    service: 'users',
    secret: 'Ej0XhakSOO92QbeyLKDUqsZPQks=',
    authStrategies: [
      'jwt',
      'local'
    ],
    jwtOptions: {
      header: {
        typ: 'access'
      },
      audience: 'https://yourdomain.com',
      issuer: 'feathers',
      algorithm: 'HS256',
      expiresIn: '1d'
    },
    local: {
      usernameField: 'email',
      passwordField: 'password'
    }
  },
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: 'replace with unique session secret',
  tlsEnabled: false,
};
