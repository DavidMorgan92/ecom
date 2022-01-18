const express = require('express');

const auth = express.Router();

auth.post('/login', (req, res) => {
	// Login a user with email and password
	res.sendStatus(200);
});

auth.post('/register', (req, res) => {
	// Register a new user with email and password
	res.sendStatus(200);
});

module.exports = auth;
