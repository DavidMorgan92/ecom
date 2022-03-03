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
 *     Checkout:
 *       type: object
 *       properties:
 *         addressId:
 *           type: integer
 *           description: ID of the address to deliver to.
 *           example: 123
 *           writeOnly: true
 *         orderId:
 *           type: integer
 *           description: ID of the order that was created.
 *           example: 123
 *           readyOnly: true
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
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
carts.param('cartId', asyncHandler(async (req, res, next, id) => {
	const requesterId = req.session.passport.user.id;
	const cart = await cartService.getCartById(requesterId, id);

	if (cart) {
		req.cartId = id;
		req.cart = cart;
		next();
	} else {
		res.status(404).send('Cart not found');
	}
}));

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
carts.get('/', asyncHandler(async (req, res) => {
	// Return all carts belonging to the authorised user
	const requesterId = req.session.passport.user.id;
	const carts = await cartService.getAllCarts(requesterId);
	res.send(carts);
}));

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
carts.post('/', asyncHandler(async (req, res) => {
	// Create a new cart belonging to the authorised user
	try {
		const requesterId = req.session.passport.user.id;
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
}));

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
carts.put('/:cartId', asyncHandler(async (req, res) => {
	// Update a cart belonging to the authorised user
	try {
		const requesterId = req.session.passport.user.id;
		const {
			name,
			items,
		} = req.body;

		const cart = await cartService.updateCart(requesterId, req.cartId, name, items);

		res.send(cart);
	} catch (err) {
		if (err.status === 400) {
			res.sendStatus(400);
		} else {
			throw err;
		}
	}
}));

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
carts.delete('/:cartId', asyncHandler(async (req, res) => {
	// Delete a cart belonging to the authorised user
	const requesterId = req.session.passport.user.id;
	const succeeded = await cartService.deleteCart(requesterId, req.cartId);

	if (succeeded) {
		res.sendStatus(204);
	} else {
		res.sendStatus(404);
	}
}));

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
 *     requesteBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Checkout'
 *     responses:
 *       200:
 *         description: Cart ordered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Checkout'
 *       400:
 *         description: Cart has already been ordered or items don't have enough stock.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Cart not found.
 */
carts.post('/:cartId/checkout', asyncHandler(async (req, res) => {
	// Dispatch the order in the cart belonging to the authorised user
	try {
		const requesterId = req.session.passport.user.id;
		const {
			addressId,
		} = req.body;

		const orderId = await cartService.checkoutCart(requesterId, req.cartId, addressId);

		res.send({
			orderId,
		});
	} catch (err) {
		if (err.status === 400) {
			res.sendStatus(400);
		} else {
			throw err;
		}
	}
}));

module.exports = carts;
