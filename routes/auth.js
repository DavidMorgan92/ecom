/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address.
 *           example: user@somewhere.com
 *         password:
 *           type: string
 *           description: User's password.
 *           example: Password01
 *     Register:
 *       allOf:
 *         - type: object
 *           properties:
 *             first_name:
 *               type: string
 *               description: User's first name.
 *               example: Benjamin
 *             last_name:
 *               type: string
 *               description: User's last name.
 *               example: Smith
 *         - $ref: '#/components/schemas/Login'
 */

const express = require('express');
const account = require('../services/account-service');

const auth = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Successful login.
 *       401:
 *         description: Unsuccessful login.
 */
auth.post('/login', (req, res) => {
	// Login a user with email and password
	res.sendStatus(200);
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       200:
 *         description: Successfully registered.
 *       400:
 *         description: Malformed request body.
 */
auth.post('/register', async (req, res) => {
	// Register a new user with email and password
	try {
		const {
			firstName,
			lastName,
			email,
			password,
		} = req.body;

		const accountInfo = await account.registerAccount(firstName, lastName, email, password);
		res.status(200).send(accountInfo);
	} catch (err) {
		if (err.status === 400) {
			res.sendStatus(400);
		} else {
			throw err;
		}
	}
});

module.exports = auth;
