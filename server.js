const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Server listens on this port
const PORT = process.env.PORT || 4001;

// Create server
const app = express();

// Init Swagger
const swaggerDefinition = require('./swagger-definition');

const swaggerJsdocOptions = {
	definition: swaggerDefinition,
	apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerJsdocOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Connect routers
app.use('/products', require('./routes/products'));
app.use('/orders', require('./routes/orders'));
app.use('/carts', require('./routes/carts'));
app.use('/addresses', require('./routes/addresses'));
app.use('/account', require('./routes/account'));
app.use('/auth', require('./routes/auth'));

// Start listening
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// Export server
module.exports = app;
