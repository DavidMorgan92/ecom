const express = require('express');

const addresses = express.Router();

addresses.param('addressId', (req, res, next, id) => {
	const address = {}; // Get address from database
	if (address) {
		req.addressId = id;
		req.address = address;
		next();
	} else {
		res.status(404).send('Address not found');
	}
});

addresses.get('/', (req, res) => {
	// Return all addresses belonging to the authorised user
	res.sendStatus(200);
});

addresses.get('/:addressId', (req, res) => {
	// Return the chosen address belonging to the authorised user
	res.sendStatus(200);
});

addresses.post('/', (req, res) => {
	// Create a new address belonging to the authorised user
	res.sendStatus(201);
});

addresses.put('/:addressId', (req, res) => {
	// Update an address belonging to the authorised user
	res.sendStatus(200);
});

addresses.delete('/:addressId', (req, res) => {
	// Delete an address belonging to the authorised user
	res.sendStatus(204);
});

module.exports = addresses;
