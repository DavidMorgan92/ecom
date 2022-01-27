const db = require('../db/index');
const { mapDboProductToApiProduct } = require('./product-service');

/**
 * Convert a database representation of a cart into an API representation
 * @param {object} cart The cart object as returned from the database
 * @returns An object that represents the cart at the API level
 */
function mapDboCartToApiCart(cart) {
	return {
		id: cart.id,
		createdAt: cart.created_at,
		name: cart.name,
		ordered: cart.ordered,
		items: cart.items ? cart.items.map(mapDboCartItemToApiCartItem) : [],
	};
}

/**
 * Convert a database representation of a cart item into an API representation
 * @param {object} cartItem The cart item object as returned from the database
 * @returns An object that represents the cart item at the API level
 */
function mapDboCartItemToApiCartItem(cartItem) {
	return {
		count: cartItem.count,
		product: mapDboProductToApiProduct(cartItem.product),
	};
}

/**
 * Get all the requesting user's cart objects
 * @param {number} requesterId The account ID of the user requesting
 * @returns Array of carts belonging to the requesting user
 */
async function getAllCarts(requesterId) {
	const query = `
		SELECT c.id, c.created_at, c.name, c.ordered,
		(
			SELECT array_to_json(array_agg(x)) FROM
			(
				SELECT cp.count,
				(
					SELECT row_to_json(y) FROM
					(
						SELECT p.id, p.name, p.description, p.category, p.price_pennies, p.stock_count
						FROM product p
						WHERE cp.product_id = p.id
					) y
				) AS product
				FROM carts_products cp
				WHERE cp.cart_id = c.id
			) x
		) AS items
		FROM cart c
		WHERE c.account_id = $1;
	`;

	const values = [requesterId];

	const result = await db.query(query, values);

	return result.rows.map(mapDboCartToApiCart);
}

/**
 * Get a cart object from the database by its ID
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} cartId The cart's ID
 * @returns The cart object requested, or null if the object doesn't match
 */
async function getCartById(requesterId, cartId) {
	const query = `
		SELECT c.id, c.created_at, c.name, c.ordered,
		(
			SELECT array_to_json(array_agg(x)) FROM
			(
				SELECT cp.count,
				(
					SELECT row_to_json(y) FROM
					(
						SELECT p.id, p.name, p.description, p.category, p.price_pennies, p.stock_count
						FROM product p
						WHERE cp.product_id = p.id
					) y
				) AS product
				FROM carts_products cp
				WHERE cp.cart_id = c.id
			) x
		) AS items
		FROM cart c
		WHERE c.account_id = $1 AND c.id = $2;
	`;

	const values = [requesterId, cartId];

	const result = await db.query(query, values);

	if (result.rowCount === 0) {
		return null;
	}

	return mapDboCartToApiCart(result.rows[0]);
}

/**
 * Check if the given inputs for the createCart function are valid
 * @param {number} requesterId The account ID of the user requesting
 * @param {string} name The cart's name
 * @param {object[]} items The items to add to the cart
 * @returns True if all inputs are valid
 */
function createCartValidateInput(requesterId, name, items) {
	if (!name || !items) {
		return false;
	}

	for (const item of items) {
		if (!item.productId || !item.count) {
			return false;
		}
	}

	return true;
}

/**
 * Create a cart belonging to the requesting user
 * @param {number} requesterId The account ID of the user requesting
 * @param {string} name The cart's name
 * @param {object[]} items The items to add to the cart
 * @returns The newly created cart object
 */
async function createCart(requesterId, name, items) {
	if (!createCartValidateInput(requesterId, name, items)) {
		throw { status: 400 };
	}

	const client = await db.getClient();

	try {
		await client.query('BEGIN');

		const cartQuery = `
			INSERT INTO cart (account_id, name)
			VALUES ($1, $2)
			RETURNING id, created_at, ordered, name;
		`;

		const cartValues = [requesterId, name];

		const cartResult = await client.query(cartQuery, cartValues);

		const cart = mapDboCartToApiCart(cartResult.rows[0]);

		for (const item of items) {
			const itemQuery = `
				INSERT INTO carts_products (cart_id, product_id, count)
				VALUES ($1, $2, $3)
				RETURNING count,
				(
					SELECT row_to_json(x) FROM
					(
						SELECT p.id, p.name, p.description, p.category, p.price_pennies, p.stock_count
						FROM product p
						WHERE product_id = p.id
					) x
				) AS product;
			`;

			const itemValues = [cart.id, item.productId, item.count];

			const itemResult = await client.query(itemQuery, itemValues);

			const newItem = mapDboCartItemToApiCartItem(itemResult.rows[0]);
			cart.items.push(newItem);
		}

		await client.query('COMMIT');

		return cart;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}

/**
 * Delete a cart belonging to the requesting user
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} cartId The cart's ID
 * @returns True if the operation succeeded
 */
async function deleteCart(requesterId, cartId) {
	const query = `
		DELETE FROM cart
		WHERE account_id = $1 AND id = $2;
	`;

	const values = [requesterId, cartId];

	const result = await db.query(query, values);

	// Return true if at least one row was changed
	return result.rowCount > 0;
}

module.exports = {
	getAllCarts,
	getCartById,
	createCartValidateInput,
	createCart,
	deleteCart,
};
