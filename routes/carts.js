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
carts.param('cartId', (req, res, next, id) => {
	const cart = {}; // Get cart from database
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
carts.get('/', (req, res) => {
	// Return all carts belonging to the authorised user
	res.sendStatus(200);
});

/**
 * @swagger
 * /carts/{id}:
 *   get:
 *     tags:
 *       - Carts
 *     summary: Retrieve one cart belonging to the authorised user.
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
 *       403:
 *         description: Cart doesn't belong to the authorised user.
 *       404:
 *         description: Cart not found.
 */
carts.get('/:cartId', (req, res) => {
	// Return the chosen cart belonging to the authorised user
	res.sendStatus(200);
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
carts.post('/', (req, res) => {
	// Create a new cart belonging to the authorised user
	res.sendStatus(201);
});

/**
 * @swagger
 * /carts/{id}:
 *   put:
 *     tags:
 *       - Carts
 *     summary: Update a cart belonging to the authorised user.
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
 *       403:
 *         description: Cart doesn't belong to the authorised user.
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
 *     parameters:
 *       - $ref: '#/components/parameters/cartId'
 *     responses:
 *       204:
 *         description: Cart deleted.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Cart doesn't belong to the authorised user.
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
 *     description: Dispatch the order in the cart belonging to the authorised user.
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
 *       403:
 *         description: Cart doesn't belong to the authorised user.
 *       404:
 *         description: Cart not found.
 */
carts.post('/:cartId/checkout', (req, res) => {
	// Dispatch the order in the cart belonging to the authorised user
	res.sendStatus(200);
});

module.exports = carts;
