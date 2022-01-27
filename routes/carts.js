/**
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Cart ID.
 *           example: 123
 *           readOnly: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date/time cart was created.
 *           example: 2017-07-21T17:32:28Z
 *           readOnly: true
 *         ordered:
 *           type: boolean
 *           description: True if the cart has been ordered.
 *           example: true
 *           readOnly: true
 *         name:
 *           type: string
 *           description: Shopping cart name.
 *           example: Christmas List
 *         items:
 *           type: array
 *           description: List of shopping cart items.
 *           items:
 *             $ref: '#/components/schemas/Item'
 */

const express = require('express');
const cartService = require('../services/cart-service');

const carts = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     cartId:
 *       in: path
 *       name: id
 *       required: true
 *       description: Cart ID.
 *       schema:
 *         type: integer
 */
carts.param('cartId', async (req, res, next, id) => {
	// TODO: Pass requesting user's ID to getCartById
	const requesterId = 1;
	const cart = await cartService.getCartById(requesterId, id);

	if (cart) {
		req.cartId = id;
		req.cart = cart;
		next();
	} else {
		res.status(404).send('Cart not found');
	}
});

/**
 * @swagger
 * /carts:
 *   get:
 *     tags:
 *       - Carts
 *     summary: Retrieve all carts belonging to the authorised user.
 *     responses:
 *       200:
 *         description: List of carts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized.
 */
carts.get('/', async (req, res) => {
	// Return all carts belonging to the authorised user
	// TODO: Pass requesting user's ID to getAllCarts
	const requesterId = 1;
	const carts = await cartService.getAllCarts(requesterId);
	res.send(carts);
});

/**
 * @swagger
 * /carts/{id}:
 *   get:
 *     tags:
 *       - Carts
 *     summary: Retrieve one cart belonging to the authorised user.
 *     description: Will simply return 404 Not Found if the requested cart ID does exist but it doesn't belong to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/cartId'
 *     responses:
 *       200:
 *         description: Cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Cart not found.
 */
carts.get('/:cartId', (req, res) => {
	// Return the chosen cart belonging to the authorised user
	res.send(req.cart);
});

/**
 * @swagger
 * /carts:
 *   post:
 *     tags:
 *       - Carts
 *     summary: Create a new cart belonging to the authorised user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cart'
 *     responses:
 *       201:
 *         description: Cart created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 */
carts.post('/', async (req, res) => {
	// Create a new cart belonging to the authorised user
	// TODO: Pass requesting user's ID to createCart
	try {
		const requesterId = 1;
		const {
			name,
			items,
		} = req.body;

		const cart = await cartService.createCart(requesterId, name, items);

		res.status(201).send(cart);
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
 * /carts/{id}:
 *   put:
 *     tags:
 *       - Carts
 *     summary: Update a cart belonging to the authorised user.
 *     description: Will simply return 404 Not Found if the requested cart ID does exist but it doesn't belong to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/cartId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cart'
 *     responses:
 *       200:
 *         description: Updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Cart not found.
 */
carts.put('/:cartId', (req, res) => {
	// Update a cart belonging to the authorised user
	res.sendStatus(200);
});

/**
 * @swagger
 * /carts/{id}:
 *   delete:
 *     tags:
 *       - Carts
 *     summary: Delete a cart belonging to the authorised user.
 *     description: Will simply return 404 Not Found if the requested cart ID does exist but it doesn't belong to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/cartId'
 *     responses:
 *       204:
 *         description: Cart deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Cart not found.
 */
carts.delete('/:cartId', (req, res) => {
	// Delete a cart belonging to the authorised user
	res.sendStatus(204);
});

/**
 * @swagger
 * /carts/{id}/checkout:
 *   post:
 *     tags:
 *       - Carts
 *     summary: Order the items in the cart.
 *     description: Dispatch the order in the cart belonging to the authorised user. Will simply return 404 Not Found if the requested cart ID does exist but it doesn't belong to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/cartId'
 *     responses:
 *       200:
 *         description: Cart ordered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Cart has already been ordered.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Cart not found.
 */
carts.post('/:cartId/checkout', (req, res) => {
	// Dispatch the order in the cart belonging to the authorised user
	res.sendStatus(200);
});

module.exports = carts;
