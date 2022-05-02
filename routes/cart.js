/**
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
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
 *           readOnly: true
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
const cartService = require('../services/cart-service');

const cart = express.Router();

/**
 * @swagger
 * /cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Retrieve the cart belonging to the authorised user.
 *     responses:
 *       200:
 *         description: Cart object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized.
 */
cart.get(
	'/',
	asyncHandler(async (req, res) => {
		// Return the cart belonging to the authorised user
		const requesterId = req.session.passport.user.id;
		const cart = await cartService.getCart(requesterId);
		res.send(cart);
	}),
);

/**
 * @swagger
 * /cart:
 *   put:
 *     tags:
 *       - Cart
 *     summary: Update the cart belonging to the authorised user.
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
 */
cart.put(
	'/',
	asyncHandler(async (req, res) => {
		// Update the cart belonging to the authorised user
		try {
			const requesterId = req.session.passport.user.id;
			const { items } = req.body;

			const cart = await cartService.updateCart(requesterId, items);

			res.send(cart);
		} catch (err) {
			if (err.status === 400) {
				res.sendStatus(400);
			} else {
				throw err;
			}
		}
	}),
);

/**
 * @swagger
 * /cart/checkout:
 *   post:
 *     tags:
 *       - Carts
 *     summary: Order the items in the cart.
 *     description: Dispatch the order in the cart belonging to the authorised user.
 *     requestBody:
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
 */
cart.post(
	'/checkout',
	asyncHandler(async (req, res) => {
		// Dispatch the order in the cart belonging to the authorised user
		try {
			const requesterId = req.session.passport.user.id;
			const { addressId } = req.body;

			const orderId = await cartService.checkoutCart(
				requesterId,
				addressId,
			);

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
	}),
);

module.exports = cart;
