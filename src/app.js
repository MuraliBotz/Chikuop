const { createServer } = require('http');
const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');


const middleware = require('./middleware');
const services = require('./services');
const session = require('./session');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');
const { connectAndSync, mongoose } = require('./mongoose');

module.exports.createApp = function createApp() {
  const app = express(feathers());

  // Load app configuration
  app.configure(configuration());
  // Enable security, CORS, compression, favicon and body parsing
  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors());
  app.use(compress());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
  // Host the public folder
  app.use('/', express.static(app.get('public')));

  const tlsEnabled = app.get('tlsEnabled');
  if (typeof tlsEnabled !== 'boolean') throw new Error('Internal error: tlsEnabled not set');
  if (tlsEnabled) app.set('trust proxy', 1); // trust first proxy

  // Set up Plugins and providers
  app.configure(express.rest());
  app.configure(socketio());
  app.configure(mongoose);
  app.configure(session);

  // Configure other middleware (see `middleware/index.js`)
  app.configure(middleware);
  app.configure(authentication);
  // Set up our services (see `services/index.js`)
  app.configure(services);
  // Set up event channels (see channels.js)
  app.configure(channels);

  // Configure a middleware for 404s and the error handler
  app.use(express.notFound());
  app.use(express.errorHandler({ logger }));

  app.hooks(appHooks);
  return app;
};

module.exports.startApp = async function startApp(app) {
  const server = createServer(app);
  const port = app.get('port');

  app.setup(server);

  await connectAndSync(app);

  await new Promise((resolve, reject) => {
    let resolved = false;
    server.on('listening', () => {
      resolved = true;
      resolve();
    });
    server.on('error', (err) => {
      logger.error(`App server had an error: ${err.message}`, err);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
    server.listen(port);
  });
  return server;
};
