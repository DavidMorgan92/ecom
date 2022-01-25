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
 *         houseNameNumber:
 *           type: string
 *           description: House name/number.
 *           example: 742
 *         streetName:
 *           type: string
 *           description: Street name.
 *           example: Evergreen Terrace
 *         townCityName:
 *           type: string
 *           description: Town/city name.
 *           example: Springfield
 *         postCode:
 *           type: string
 *           description: Post code.
 *           example: AA00 0AA
 */

const express = require('express');
const addressService = require('../services/address-service');

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
addresses.param('addressId', async (req, res, next, id) => {
	// TODO: Pass requesting user's ID to getAddressById
	const requesterId = 1;
	const address = await addressService.getAddressById(requesterId, id);

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
addresses.get('/', async (req, res) => {
	// Return all addresses belonging to the authorised user
	// TODO: Pass requesting user's ID to getAllAddresses
	const requesterId = 1;
	const addresses = await addressService.getAllAddresses(requesterId);
	res.send(addresses);
});

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: Retrieve one address belonging to the authorised user.
 *     description: Will simply return 404 Not Found if the requested address ID does exist but it doesn't belong to the authorised user.
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
 *       404:
 *         description: Address not found.
 */
addresses.get('/:addressId', (req, res) => {
	// Return the chosen address belonging to the authorised user
	res.send(req.address);
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
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 */
addresses.post('/', async (req, res) => {
	// Create a new address belonging to the authorised user
	// TODO: Pass requesting user's ID to createAddress
	try {
		const requesterId = 1;
		const {
			houseNameNumber,
			streetName,
			townCityName,
			postCode,
		} = req.body;
		
		const address = await addressService.createAddress(requesterId, houseNameNumber, streetName, townCityName, postCode);

		res.status(201).send(address);
	} catch (err) {
		if (err.status === 400) {
			res.sendStatus(400);
		} else {
			throw err;
		}
	}
});

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     tags:
 *       - Addresses
 *     summary: Update an address belonging to the authorised user.
 *     description: Will simply return 404 Not Found if the requested address ID does exist but it doesn't belong to the authorised user.
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
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Address not found.
 */
addresses.put('/:addressId', async (req, res) => {
	// Update an address belonging to the authorised user
	// TODO: Pass requesting user's ID to updateAddress
	try {
		const requesterId = 1;
		const {
			houseNameNumber,
			streetName,
			townCityName,
			postCode,
		} = req.body;

		const address = await addressService.updateAddress(requesterId, req.addressId, houseNameNumber, streetName, townCityName, postCode);

		res.send(address);
	} catch (err) {
		if (err.status === 400) {
			res.sendStatus(400);
		} else {
			throw err;
		}
	}
});

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     tags:
 *       - Addresses
 *     summary: Delete an address belonging to the authorised user.
 *     description: Will simply return 404 Not Found if the requested address ID does exist but it doesn't belong to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/addressId'
 *     responses:
 *       204:
 *         description: Address deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Address not found.
 */
addresses.delete('/:addressId', async (req, res) => {
	// Delete an address belonging to the authorised user
	// TODO: Pass requesting user's ID to deleteAddress
	const requesterId = 1;
	const succeeded = await addressService.deleteAddress(requesterId, req.addressId);

	if (succeeded) {
		res.sendStatus(204);
	} else {
		res.sendStatus(404);
	}
});

module.exports = addresses;
