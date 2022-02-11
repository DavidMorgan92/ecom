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
 *         price:
 *           type: number
 *           description: Product price.
 *           example: 1.23
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
const productService = require('../services/product-service');

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
products.param('productId', async (req, res, next, id) => {
	const product = await productService.getProductById(id);

	if (product) {
		req.productId = id;
		req.product = product;
		next();
	} else {
		res.status(404).send('Product not found');
	}
});

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
products.get('/', async (req, res) => {
	// Return all products, optionally filtered
	let products = [];

	if (req.query.id) {
		let ids = req.query.id;
		if (!Array.isArray(req.query.id)) {
			ids = [req.query.id];
		}
		products = await productService.getMultipleProductsById(ids);
	} else if (req.query.name || req.query.category) {
		products = await productService.getProductsByCategoryAndName(req.query.category, req.query.name);
	}

	res.send(products);
});

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

module.exports = products;
