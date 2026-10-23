/**
 * Express Application Setup
 * Mengkonfigurasi middleware, routes, error handling, dan dokumentasi Swagger
 */
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../docs/swagger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Root redirect to API docs ===
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// === Swagger Documentation ===
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// === API Routes ===
app.use('/api', routes);

// === Error Handling (harur didefinisikan setelah routes) ===
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
