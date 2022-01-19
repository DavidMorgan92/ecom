/**
 * @swagger
 * components:
 *   schemas:
 *    Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Address ID.
 *           example: 123
 *           readOnly: true
 *         house_name_number:
 *           type: string
 *           description: House name/number.
 *           example: 742
 *         street_name:
 *           type: string
 *           description: Street name.
 *           example: Evergreen Terrace
 *         town_city_name:
 *           type: string
 *           description: Town/city name.
 *           example: Springfield
 *         post_code:
 *           type: string
 *           description: Post code.
 *           example: AA00 0AA
 */

const express = require('express');

const addresses = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     addressId:
 *       in: path
 *       name: id
 *       required: true
 *       description: Address ID.
 *       schema:
 *         type: integer
 */
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

/**
 * @swagger
 * /addresses:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: Retrieve all addresses belonging to the authorised user.
 *     responses:
 *       200:
 *         description: List of addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized.
 */
addresses.get('/', (req, res) => {
	// Return all addresses belonging to the authorised user
	res.sendStatus(200);
});

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: Retrieve one address belonging to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/addressId'
 *     responses:
 *       200:
 *         description: Address.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Address doesn't belong to the authorised user.
 *       404:
 *         description: Address not found.
 */
addresses.get('/:addressId', (req, res) => {
	// Return the chosen address belonging to the authorised user
	res.sendStatus(200);
});

/**
 * @swagger
 * /addresses:
 *   post:
 *     tags:
 *       - Addresses
 *     summary: Create a new address belonging to the authorised user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Malformed request body.
 *       401:
 *         description: Unauthorized.
 */
addresses.post('/', (req, res) => {
	// Create a new address belonging to the authorised user
	res.sendStatus(201);
});

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     tags:
 *       - Addresses
 *     summary: Update an address belonging to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/addressId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Updated address.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Malformed request body.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Address doesn't belong to the authorised user.
 *       404:
 *         description: Address not found.
 */
addresses.put('/:addressId', (req, res) => {
	// Update an address belonging to the authorised user
	res.sendStatus(200);
});

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     tags:
 *       - Addresses
 *     summary: Delete an address belonging to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/addressId'
 *     responses:
 *       204:
 *         description: Address deleted.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Address doesn't belong to the authorised user.
 *       404:
 *         description: Address not found.
 */
addresses.delete('/:addressId', (req, res) => {
	// Delete an address belonging to the authorised user
	res.sendStatus(204);
});

module.exports = addresses;
