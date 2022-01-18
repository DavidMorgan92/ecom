const express = require('express');

const orders = express.Router();

orders.param('orderId', (req, res, next, id) => {
	const order = {}; // Get order from database
	if (order) {
		req.orderId = id;
		req.order = order;
		next();
	} else {
		res.status(404).send('Order not found');
	}
});

orders.get('/', (req, res) => {
	// Return all orders for the authorised user
	res.sendStatus(200);
});

orders.get('/:orderId', (req, res) => {
	// Return the chosen order for the authorised user
	res.sendStatus(200);
});

module.exports = orders;
