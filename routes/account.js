/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateAccount:
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
 *     Account:
 *       allOf:
 *         - type: object
 *           properties:
 *             email:
 *               type: string
 *               description: User's email address.
 *               example: user@somewhere.com
 *         - $ref: '#/components/schemas/UpdateAccount'
 */

const express = require('express');

const account = express.Router();

/**
 * @swagger
 * /account:
 *   get:
 *     summary: Retrieve account information for the authorised user.
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
account.get('/', (req, res) => {
	// Return the account of the authorised user
	res.sendStatus(200);
});

/**
 * @swagger
 * /account:
 *   put:
 *     summary: Update account information for the authorised user.
 *     description: Provide only the values that require changing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccount'
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
