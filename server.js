const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const authService = require('./services/auth-service');

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

// Use body parser
app.use(express.json());

// Use session
app.use(expressSession({
	secret: 'secret',
	resave: false,
	saveUninitialized: false,
}));

// Setup passport
passport.serializeUser(authService.serializeUser);
passport.deserializeUser(authService.deserializeUser);

passport.use(new passportLocal.Strategy(
	{
		usernameField: 'email',
		passwordField: 'password',
	},
	authService.authenticateUser
));

// Use passport
app.use(passport.initialize());
app.use(passport.session());

// Connect routers
app.use('/products', require('./routes/products'));
app.use('/orders', authService.protectedRoute, require('./routes/orders'));
app.use('/carts', authService.protectedRoute, require('./routes/carts'));
app.use('/addresses', authService.protectedRoute, require('./routes/addresses'));
app.use('/account', authService.protectedRoute, require('./routes/account'));
app.use('/auth', require('./routes/auth'));

// Export server
module.exports = app;
