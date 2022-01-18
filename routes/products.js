const express = require('express');

const products = express.Router();

products.param('productId', (req, res, next, id) => {
	const product = {}; // Get product from database
	if (product) {
		req.productId = id;
		req.product = product;
		next();
	} else {
		res.status(404).send('Product not found');
	}
});

products.get('/', (req, res) => {
	// Return all products, optionally filtered
	res.sendStatus(200);
});

products.get('/:productId', (req, res) => {
	// Return the chosen product
	res.sendStatus(200);
});

module.exports = products;
