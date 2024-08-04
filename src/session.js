const session = require('express-session');
const MongoStore = require('connect-mongo');


module.exports = function sessionInit(app) {
  const connectionString = app.get('databaseUrl');
  if (!connectionString) throw new Error('Database connection string is not set in config \'databaseUrl\'');
  const tlsEnabled = app.get('tlsEnabled');

  const sess = session({
    cookie: {
      secure: tlsEnabled,
    },

    // True if we do SSL external to Node
    proxy: tlsEnabled,

    // session-sequelize supports the touch method so per the
    // express-session docs this should be set to false
    resave: false,

    saveUninitialized: true,
    secret: app.get('sessionSecret'),
    store: MongoStore.create({
      mongoUrl: connectionString,
    }),
  });

  app.set('expressSession', sess);
  app.use(sess);
};
