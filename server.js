const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Server listens on this port
const PORT = process.env.PORT || 4001;

// Create server
const app = express();

// Init Swagger
const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'ecom',
			version: '1.0.0',
		},
	},
	apis: []
};

const specs = swaggerJsdoc(options);
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
