const express = require('express');

const carts = express.Router();

carts.param('cartId', (req, res, next, id) => {
	const cart = {}; // Get cart from database
	if (cart) {
		req.cartId = id;
		req.cart = cart;
		next();
	} else {
		res.status(404).send('Cart not found');
	}
});

carts.get('/', (req, res) => {
	// Return all carts belonging to the authorised user
	res.sendStatus(200);
});

carts.get('/:cartId', (req, res) => {
	// Return the chosen cart belonging to the authorised user
	res.sendStatus(200);
});

carts.post('/', (req, res) => {
	// Create a new cart belonging to the authorised user
	res.sendStatus(201);
});

carts.put('/:cartId', (req, res) => {
	// Update a cart belonging to the authorised user
	res.sendStatus(200);
});

carts.delete('/:cartId', (req, res) => {
	// Delete a cart belonging to the authorised user
	res.sendStatus(204);
});

carts.post('/:cartId/checkout', (req, res) => {
	// Dispatch the order in the cart belonging to the authorised user
	res.sendStatus(200);
});

module.exports = carts;
