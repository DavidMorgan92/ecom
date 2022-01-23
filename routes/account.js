/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: User's first name.
 *           example: Benjamin
 *         last_name:
 *           type: string
 *           description: User's last name.
 *           example: Smith
 *         email:
 *           type: string
 *           description: User's email address.
 *           example: user@somewhere.com
 *           readOnly: true
 */

const express = require('express');
const accountService = require('../services/account-service');

const account = express.Router();

/**
 * @swagger
 * /account:
 *   get:
 *     tags:
 *       - Account
 *     summary: Retrieve account information belonging to the authorised user.
 *     responses:
 *       200:
 *         description: Account information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       401:
 *         description: Unauthorized.
 */
account.get('/', async (req, res) => {
	// Get user ID from authentication service
	const userId = 1;
	// Return the account of the authorised user
	const accountInfo = await accountService.getAccountInfo(userId);
	res.send(accountInfo);
});

/**
 * @swagger
 * /account:
 *   put:
 *     tags:
 *       - Account
 *     summary: Update account information belonging to the authorised user.
 *     description: Provide only the values that require changing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Account'
 *     responses:
 *       200:
 *         description: Updated account information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 */
account.put('/', async (req, res) => {
	try {
		const userId = 1;

		const {
			firstName,
			lastName,
		} = req.body;

		const accountInfo = await accountService.updateAccountInfo(userId, firstName, lastName);
		// Update the account of the authorised user
		res.send(accountInfo);
	} catch (err) {
		if (err.status === 400) {
			res.sendStatus(400);
		} else {
			throw err;
		}
	}
});

module.exports = account;
