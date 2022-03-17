const db = require('../db');

/**
 * Convert a database representation of a product into an API representation
 * @param {object} product The product object as returned from the database
 * @returns An object that represents the product at the API level
 */
function mapDboProductToApiProduct(product) {
	return {
		id: product.id,
		name: product.name,
		description: product.description,
		category: product.category,
		pricePennies: product.price_pennies,
		stockCount: product.stock_count,
	};
}

/**
 * Get a product object by its unique ID
 * @param {number} id The product's ID
 * @returns Product object
 */
async function getProductById(id) {
	const query = `
		SELECT id, name, description, category, price_pennies, stock_count
		FROM product
		WHERE id = $1;
	`;

	const values = [id];

	const result = await db.query(query, values);

	if (result.rowCount === 0) {
		return null;
	}

	return mapDboProductToApiProduct(result.rows[0]);
}

/**
 * Get multiple products with an array of IDs
 * @param {number[]} ids Array of product IDs
 * @returns Array of product objects
 */
async function getMultipleProductsById(ids) {
	const query = `
		SELECT id, name, description, category, price_pennies, stock_count
		FROM product
		WHERE id = ANY($1);
	`;

	const values = [ids];

	const result = await db.query(query, values);

	return result.rows.map(mapDboProductToApiProduct);
}

/**
 * Return a list of products matching the search parameters.
 * If both category and name are given then products with category and name like %param% are returned.
 * If only category or name is given then products are returned with only the given parameter checked.
 * If no parameter is given null is returned.
 * @param {string} category Name of category to search
 * @param {string} name Name of product to search
 * @returns List of products matching the search terms
 */
async function getProductsByCategoryAndName(category, name) {
	let query = '';
	let values = [];

	/**
	 * TODO:
	 * Lower function is used to make searches case insensitive
	 * Could be slow due to not working with indexes
	 * Consider another approach
	 */

	if (category && name) {
		query = `
			SELECT id, name, description, category, price_pennies, stock_count
			FROM product
			WHERE LOWER(category) LIKE '%' || LOWER($1) || '%' AND LOWER(name) LIKE '%' || LOWER($2) || '%';
		`;

		values = [category, name];
	} else if (category) {
		query = `
			SELECT id, name, description, category, price_pennies, stock_count
			FROM product
			WHERE LOWER(category) LIKE '%' || LOWER($1) || '%';
		`;

		values = [category];
	} else if (name) {
		query = `
			SELECT id, name, description, category, price_pennies, stock_count
			FROM product
			WHERE LOWER(name) LIKE '%' || LOWER($1) || '%';
		`;

		values = [name];
	} else {
		return null;
	}

	const result = await db.query(query, values);

	return result.rows.map(mapDboProductToApiProduct);
}

/**
 * Get all products in the database
 * @returns All products in the database
 */
async function getAllProducts() {
	const query = `
		SELECT id, name, description, category, price_pennies, stock_count
		FROM product;
	`;

	const result = await db.query(query);

	return result.rows.map(mapDboProductToApiProduct);
}

module.exports = {
	mapDboProductToApiProduct,
	getProductById,
	getMultipleProductsById,
	getProductsByCategoryAndName,
	getAllProducts,
};
