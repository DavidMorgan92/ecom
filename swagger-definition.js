/**
 * Defines Swagger configuration
 */
module.exports = {
	openapi: '3.0.0',
	info: {
		title: 'ecom API',
		description: 'A REST API for the E-Commerce Coedecademy portfolio project',
		version: '1.0.0',
	},
	servers: [
		{
			url: 'http://localhost:4001',
			description: 'Development server',
		},
	],
};
