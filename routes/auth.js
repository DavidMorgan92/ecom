/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address.
 *           example: user@somewhere.com
 *         password:
 *           type: string
 *           description: User's password.
 *           example: Password01
 *           writeOnly: true
 *     Register:
 *       allOf:
 *         - type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: User's first name.
 *               example: Benjamin
 *             lastName:
 *               type: string
 *               description: User's last name.
 *               example: Smith
 *         - $ref: '#/components/schemas/Login'
 *     GoogleLogin:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Login token obtained from Google.
 *           example: 0123456789abcdef
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
const account = require('../services/account-service');
const authService = require('../services/auth-service');

const auth = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Successful login.
 *       401:
 *         description: Unsuccessful login.
 */
auth.post('/login', authService.authenticate, (err, req, res, next) => {
	if (err) {
		next(err);
	}
});

/**
 * @swagger
 * /auth/google:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with Google token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLogin'
 *     responses:
 *       200:
 *         description: Successful login.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       401:
 *         description: Unsuccessful login.
 */
auth.post('/google', authService.authenticateGoogle, (err, req, res, next) => {
	if (err) {
		return next(err);
	}
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout of an authentication session.
 *     responses:
 *       200:
 *         description: Successfully logged out.
 *       401:
 *         description: Not authenticated.
 */
auth.post('/logout', authService.protectedRoute, (req, res) => {
	req.logout();
	res.sendStatus(200);
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       200:
 *         description: Successfully registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Register'
 *       400:
 *         description: Invalid input.
 */
auth.post(
	'/register',
	asyncHandler(async (req, res) => {
		// Register a new user with email and password
		try {
			const { firstName, lastName, email, password } = req.body;

			const accountInfo = await account.registerAccount(
				firstName,
				lastName,
				email,
				password,
			);
			res.send(accountInfo);
		} catch (err) {
			if (err.status === 400) {
				res.sendStatus(400);
			} else {
				throw err;
			}
		}
	}),
);

module.exports = auth;
