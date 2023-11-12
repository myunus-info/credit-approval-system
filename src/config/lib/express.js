const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xssClean = require('xss-clean');
const config = require('../config');
const nodeCache = require(path.join(process.cwd(), 'src/config/lib/nodecache'));
const { AppError, globalErrorHandler } = require(path.join(process.cwd(), 'src/modules/core/errors'));

module.exports = () => {
  const app = express();

  // Set security http headers
  app.use(helmet());
  // Development logging
  app.use(morgan('dev'));
  // Limit requests from same API
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try again in an hour!',
  });
  app.use('/api', limiter);

  // Data sanitization against XSS (Cross Site Scripting) attack
  app.use(xssClean());

  app.use(express.json({ limit: '10kb' }));
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));

  app.set('port', nodeCache.getValue('PORT'));

  const globalConfig = config.getGlobalConfig();

  globalConfig.routes.forEach(routePath => require(path.resolve(routePath))(app));

  app.all('*', (req, res, next) => {
    return next(new AppError(404, `Could not find ${req.originalUrl} on this server`));
  });
  app.use(globalErrorHandler);

  return app;
};
