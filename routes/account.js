const express = require('express');

const account = express.Router();

account.param('accountId', (req, res, next, id) => {
	const account = {}; // Get account from database
	if (account) {
		req.accountId = id;
		req.account = account;
		next();
	} else {
		res.status(404).send('Account not found');
	}
});

account.get('/', (req, res) => {
	// Return the account of the authorised user
	res.sendStatus(200);
});

account.put('/', (req, res) => {
	// Update the account of the authorised user
	res.sendStatus(200);
});

module.exports = account;
