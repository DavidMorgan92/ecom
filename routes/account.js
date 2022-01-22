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
	res.status(200).send(accountInfo);
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
 *         description: Malformed request body.
 *       401:
 *         description: Unauthorized.
 */
account.put('/', (req, res) => {
	// Update the account of the authorised user
	res.sendStatus(200);
});

module.exports = account;
