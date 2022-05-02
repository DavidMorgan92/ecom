const db = require('../db');
const { mapDboProductToApiProduct } = require('./product-service');

/**
 * Convert a database representation of a cart into an API representation
 * @param {object} cart The cart object as returned from the database
 * @returns An object that represents the cart at the API level
 */
function mapDboCartToApiCart(cart) {
	return {
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
 * Get the cart belonging to the user
 * @param {number} requesterId The account ID of the user requesting
 * @returns The cart object
 */
async function getCart(requesterId) {
	const query = `
		SELECT array_to_json(array_agg(x)) AS items FROM
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
			WHERE cp.account_id = $1
		) AS x
	`;

	const values = [requesterId];

	const result = await db.query(query, values);

	return mapDboCartToApiCart(result.rows[0]);
}

/**
 * Ensures that a product ID is not duplicated in the list of items
 * @param {object[]} items List of items to consolidate
 * @returns Consolidated list of items
 */
function consolidateItems(items) {
	const newItems = [];

	for (const item of items) {
		if (newItems.find(i => i.productId === item.productId)) {
			continue;
		}

		let totalCount = 0;

		items.forEach(value => {
			if (value.productId === item.productId) {
				totalCount += value.count;
			}
		});

		newItems.push({
			count: totalCount,
			productId: item.productId,
		});
	}

	return newItems;
}

/**
 * Check if the given inputs for the updateCart function are valid
 * @param {number} requesterId The account ID of the user requesting
 * @param {object[]} items The items now contained in the cart
 * @returns True if all inputs are valid
 */
function updateCartValidateInput(requesterId, items) {
	if (!items) {
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
 * Update a cart belonging to the requesting user
 * @param {number} requesterId The account ID of the user requesting
 * @param {object[]} items The items now contained in the cart
 * @returns The updated cart object
 */
async function updateCart(requesterId, items) {
	if (!updateCartValidateInput(requesterId, items)) {
		throw { status: 400 };
	}

	const client = await db.getClient();

	try {
		await client.query('BEGIN');

		const consolidatedItems = consolidateItems(items);

		const existingItemsQuery = `
			SELECT account_id, product_id, count
			FROM carts_products
			WHERE account_id = $1;
		`;

		const existingItemsValues = [requesterId];

		const existingItemsResult = await client.query(
			existingItemsQuery,
			existingItemsValues,
		);

		const existingItems = existingItemsResult.rows;

		const cart = { items: [] };

		// Compare existing items and new items and create/update/delete as appropriate
		for (const existingItem of existingItems) {
			const item = consolidatedItems.find(
				i => i.productId === existingItem.product_id,
			);

			// If existing item is in the new item list
			if (item) {
				// If the count is different, update the existing record
				if (item.count !== existingItem.count) {
					const updateCountQuery = `
						UPDATE carts_products
						SET count = $3
						WHERE account_id = $1 AND product_id = $2
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

					const updateResult = await client.query(updateCountQuery, [
						requesterId,
						existingItem.product_id,
						item.count,
					]);

					// Add updated item to cart for return
					cart.items.push(mapDboCartItemToApiCartItem(updateResult.rows[0]));
				} else {
					// If the count has not been updated, add the existing item to the cart for returning
					const itemQuery = `
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
						WHERE cp.account_id = $1 AND cp.product_id = $2;
					`;

					const itemResult = await client.query(itemQuery, [
						requesterId,
						existingItem.product_id,
					]);
					cart.items.push(mapDboCartItemToApiCartItem(itemResult.rows[0]));
				}
			} else {
				// If the existing item is not in the new item list, delete the record
				const deleteQuery = `
					DELETE FROM carts_products
					WHERE account_id = $1 AND product_id = $2;
				`;

				await client.query(deleteQuery, [requesterId, existingItem.product_id]);
			}
		}

		for (const newItem of consolidatedItems) {
			const existingItem = existingItems.find(
				i => i.product_id === newItem.productId,
			);

			// If no existing item exists that matches the new item, insert the new item
			if (!existingItem) {
				const insertQuery = `
					INSERT INTO carts_products (account_id, product_id, count)
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

				const insertResult = await client.query(insertQuery, [
					requesterId,
					newItem.productId,
					newItem.count,
				]);

				// Add inserted item to cart for return
				cart.items.push(mapDboCartItemToApiCartItem(insertResult.rows[0]));
			}
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
 * Order the items in the cart belonging to the requesting user, and have them sent to the given address.
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} addressId The ID of the address to which to send the order
 * @returns The ID of the order
 */
async function checkoutCart(requesterId, addressId) {
	// Create order with same items as the cart
	const cart = await getCart(requesterId);

	const client = await db.getClient();

	try {
		// Check cart is not empty
		if (cart.items.length === 0) {
			throw { status: 400, message: 'Cart is empty' };
		}

		// Check cart items' stock levels
		for (const item of cart.items) {
			const result = await client.query(
				'SELECT stock_count FROM product WHERE id = $1',
				[item.product.id],
			);
			const stockCount = result.rows[0].stock_count;
			if (item.count > stockCount) {
				throw {
					status: 400,
					message: `Cart item "${item.product.name}" does not have enough stock left`,
				};
			}
		}

		// Check the address exists and belongs to the requesting user
		const result = await client.query(
			'SELECT id FROM address WHERE id = $1 AND account_id = $2',
			[addressId, requesterId],
		);
		if (result.rowCount === 0) {
			throw { status: 400, message: 'Given address ID not found' };
		}

		await client.query('BEGIN');

		// Create an order record
		const orderId = (
			await client.query(
				`
					INSERT INTO "order" (account_id, address_id)
					VALUES ($1, $2)
					RETURNING id;
				`,
				[requesterId, addressId],
			)
		).rows[0].id;

		// Create an orders_products record for each cart item
		for (const item of cart.items) {
			await client.query(
				`
					INSERT INTO orders_products (order_id, product_id, count)
					VALUES ($1, $2, $3);
				`,
				[orderId, item.product.id, item.count],
			);
		}

		// Empty the cart
		await client.query(
			`
				DELETE FROM carts_products
				WHERE account_id = $1;
			`,
			[requesterId],
		);

		// Reduce stock count for each item ordered
		for (const item of cart.items) {
			await client.query(
				`
					UPDATE product
					SET stock_count = stock_count - $2
					WHERE id = $1;
				`,
				[item.product.id, item.count],
			);
		}

		await client.query('COMMIT');

		return orderId;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}

module.exports = {
	getCart,
	updateCartValidateInput,
	updateCart,
	checkoutCart,
	consolidateItems,
};
