/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Product ID.
 *           example: 123
 *           readOnly: true
 *         name:
 *           type: string
 *           description: Product name.
 *           example: Toothbrush
 *         description:
 *           type: string
 *           description: Product description.
 *           example: Bristly
 *         category:
 *           type: string
 *           description: Product category.
 *           example: Health & Beauty
 *         pricePennies:
 *           type: string
 *           description: Product price as big int in pennies.
 *           example: 123
 *         stockCount:
 *           type: integer
 *           description: Number of items in stock.
 *           example: 23
 *     Item:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *           description: Product ID.
 *           example: 123
 *           writeOnly: true
 *         count:
 *           type: integer
 *           description: Number of the item ordered.
 *           example: 23
 *         product:
 *           readOnly: true
 *           allOf:
 *             - $ref: '#/components/schemas/Product'
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
const productService = require('../services/product-service');
const authService = require('../services/auth-service');

const products = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     productId:
 *       in: path
 *       name: id
 *       required: true
 *       description: Product ID.
 *       schema:
 *         type: integer
 */
products.param(
	'productId',
	asyncHandler(async (req, res, next, id) => {
		const product = await productService.getProductById(id);

		if (product) {
			req.productId = id;
			req.product = product;
			next();
		} else {
			res.status(404).send('Product not found');
		}
	}),
);

/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Retrieve all products.
 *     description: Retrieve an array of items from their given IDs. Or filter by category and/or by name.
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         description: Get only items belonging to this category.
 *         example: Health & Beauty
 *         schema:
 *           type: string
 *       - name: name
 *         in: query
 *         required: false
 *         description: Get items with name like this parameter.
 *         example: Toothbrush
 *         schema:
 *           type: string
 *       - name: id
 *         in: query
 *         required: false
 *         description: Provide an array of product IDs to get them. Will override the other query parameters.
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *     responses:
 *       200:
 *         description: List of products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
products.get(
	'/',
	asyncHandler(async (req, res) => {
		// Return all products, optionally filtered
		let products = [];

		if (req.query.id) {
			let ids = req.query.id;
			if (!Array.isArray(req.query.id)) {
				ids = [req.query.id];
			}
			products = await productService.getMultipleProductsById(ids);
		} else if (req.query.name || req.query.category) {
			products = await productService.getProductsByCategoryAndName(
				req.query.category,
				req.query.name,
			);
		} else {
			products = await productService.getAllProducts();
		}

		res.send(products);
	}),
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Retrieve one product.
 *     parameters:
 *       - $ref: '#/components/parameters/productId'
 *     responses:
 *       200:
 *         description: Product.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found.
 */
products.get('/:productId', (req, res) => {
	// Return the chosen product
	res.send(req.product);
});

/**
 * @swagger
 * /products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
products.post(
	'/',
	authService.protectedRoute,
	authService.adminRoute,
	asyncHandler(async (req, res) => {
		try {
			const { name, description, category, pricePennies, stockCount } =
				req.body;

			const product = await productService.createProduct(
				name,
				description,
				category,
				pricePennies,
				stockCount,
			);

			res.status(201).send(product);
		} catch (err) {
			if (err.status === 400) {
				res.sendStatus(400);
			} else {
				throw err;
			}
		}
	}),
);

module.exports = products;
