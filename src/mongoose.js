const mongooseClient = require('mongoose');

module.exports.mongoose = function mongoose(app) {
  app.set('mongooseClient', mongooseClient);
};


module.exports.connectAndSync = async function connectAndSync(app) {
  const connectionString = app.get('databaseUrl');
  if (!connectionString) throw new Error('Database connection string is not set in config \'databaseUrl\'');

  // Wait a while for the database to be up
  let tries = 20;
  while (--tries >= 0) {
    try {
      await mongooseClient.connect(connectionString);
      break;
    } catch (err) {
      if (tries === 0) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};
