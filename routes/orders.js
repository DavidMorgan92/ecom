/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Cart ID.
 *           example: 123
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date/time order was created.
 *           example: 2017-07-21T17:32:28Z
 *         address:
 *           description: Address to which the order will be shipped.
 *           $ref: '#/components/schemas/Address'
 *         items:
 *           type: array
 *           description: Items in the order.
 *           items:
 *             $ref: '#/components/schemas/Item'
 */

const express = require('express');
const orderService = require('../services/order-service');

const orders = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     orderId:
 *       in: path
 *       name: id
 *       required: true
 *       description: Order ID.
 *       schema:
 *         type: integer
 */
orders.param('orderId', (req, res, next, id) => {
	const order = {}; // Get order from database
	if (order) {
		req.orderId = id;
		req.order = order;
		next();
	} else {
		res.status(404).send('Order not found');
	}
});

/**
 * @swagger
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Retrieve all orders belonging to the authorised user.
 *     responses:
 *       200:
 *         description: List of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized.
 */
orders.get('/', async (req, res) => {
	// Return all orders for the authorised user
	// TODO: Pass requesting user's ID to getAllOrders
	const requesterId = 1;
	const orders = await orderService.getAllOrders(requesterId);
	res.send(orders);
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Retrieve one order belonging to the authorised user.
 *     parameters:
 *       - $ref: '#/components/parameters/orderId'
 *     responses:
 *       200:
 *         description: Order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Order doesn't belong to the authorised user.
 *       404:
 *         description: Order not found.
 */
orders.get('/:orderId', (req, res) => {
	// Return the chosen order for the authorised user
	res.sendStatus(200);
});

module.exports = orders;
