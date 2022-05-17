const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authService = require('./services/auth-service');

// Create server
const app = express();

// Init helmet
app.use(helmet());

// Init Swagger
const swaggerDefinition = require('./swagger-definition');

const swaggerJsdocOptions = {
	definition: swaggerDefinition,
	apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerJsdocOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Use logger
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common'));

// Enable CORS
app.use(
	cors({
		origin: process.env.CLIENT_ORIGIN,
		credentials: true,
	}),
);

// Use body parser
app.use(express.json());

// Use session
app.use(
	expressSession({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	}),
);

// Setup passport
passport.serializeUser(authService.serializeUser);
passport.deserializeUser(authService.deserializeUser);

passport.use(
	new passportLocal.Strategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		authService.authenticateUser,
	),
);

// Use passport
app.use(passport.initialize());
app.use(passport.session());

// Connect routers
app.use('/products', require('./routes/products'));
app.use('/orders', authService.protectedRoute, require('./routes/orders'));
app.use('/cart', authService.protectedRoute, require('./routes/cart'));
app.use(
	'/addresses',
	authService.protectedRoute,
	require('./routes/addresses'),
);
app.use('/account', authService.protectedRoute, require('./routes/account'));
app.use('/auth', require('./routes/auth'));

// Export server
module.exports = app;
