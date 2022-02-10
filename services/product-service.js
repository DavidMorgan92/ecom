const db = require('../db/index');

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

module.exports = {
	mapDboProductToApiProduct,
	getProductById,
	getMultipleProductsById,
};
