/**
 * @swagger
 * components:
 *   schemas:
 *     Intent:
 *       type: object
 *       properties:
 *         pricePennies:
 *           type: number
 *           description: Price to request from user's account in pennies.
 *           example: 1000
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
const stripeService = require('../services/stripe-service');

const stripe = express.Router();

/**
 * @swagger
 * /stripe/intent:
 *   get:
 *     tags:
 *       - Stripe integration
 *     summary: Begin a payment through Stripe.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Intent'
 *     responses:
 *       200:
 *         description: Stripe client secret.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
stripe.post(
	'/intent',
	asyncHandler(async (req, res) => {
		try {
			const requesterEmail = req.session.passport.user.email;
			const { pricePennies } = req.body;

			const clientSecret = await stripeService.beginTransaction(
				pricePennies,
				requesterEmail,
			);

			// Return the client secret used to complete the transaction on the client
			res.send(clientSecret);
		} catch (err) {
			if (err.status === 400) {
				res.sendStatus(400);
			} else {
				throw err;
			}
		}
	}),
);

module.exports = stripe;
