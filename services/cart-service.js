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

	const consolidatedItems = consolidateItems(items);

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

		for (const item of consolidatedItems) {
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
 * Check if the given inputs for the updateCart function are valid
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} cartId The ID of the cart to update
 * @param {string} name The cart's new name
 * @param {object[]} items The items now contained in the cart. Pass a falsy value to only update the name.
 * @returns True if all inputs are valid
 */
function updateCartValidateInput(requesterId, cartId, name, items) {
	if (!name) {
		return false;
	}

	// Falsy items is valid but not iterable
	if (!items) {
		return true;
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
 * @param {number} cartId The ID of the cart to update
 * @param {string} name The cart's new name
 * @param {object[]} items The items now contained in the cart. Pass a falsy value to only update the name.
 * @returns The updated cart object
 */
async function updateCart(requesterId, cartId, name, items) {
	if (!updateCartValidateInput(requesterId, cartId, name, items)) {
		throw { status: 400 };
	}

	const client = await db.getClient();

	try {
		await client.query('BEGIN');

		// Update cart's name
		const cartQuery = `
			UPDATE cart
			SET name = $3
			WHERE account_id = $1 AND id = $2
			RETURNING id, created_at, ordered, name;
		`;

		const cartValues = [requesterId, cartId, name];

		const cartResult = await client.query(cartQuery, cartValues);

		const cart = mapDboCartToApiCart(cartResult.rows[0]);

		// If a new list of items is given
		if (items) {
			// Sort input items by product ID
			const consolidatedItems = consolidateItems(items);

			// Update cart's items
			// Get existing items and sort them by product ID
			const existingItemsQuery = `
				SELECT cart_id, product_id, count
				FROM carts_products
				WHERE cart_id = $1;
			`;

			const existingItemsValues = [cartId];

			const existingItemsResult = await client.query(existingItemsQuery, existingItemsValues);

			const existingItems = existingItemsResult.rows;

			// Compare existing items and new items and create/update/delete as appropriate
			for (const existingItem of existingItems) {
				const item = consolidatedItems.find(i => i.productId === existingItem.product_id);

				// If existing item is in the new item list
				if (item) {
					// If the count is different, update the existing record
					if (item.count !== existingItem.count) {
						const updateCountQuery = `
							UPDATE carts_products
							SET count = $3
							WHERE cart_id = $1 AND product_id = $2
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

						const updateResult = await client.query(updateCountQuery, [cartId, existingItem.product_id, item.count]);

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
							WHERE cp.cart_id = $1 AND cp.product_id = $2;
						`;

						const itemResult = await client.query(itemQuery, [cartId, existingItem.product_id]);
						cart.items.push(mapDboCartItemToApiCartItem(itemResult.rows[0]));
					}
				} else {
					// If the existing item is not in the new item list, delete the record
					const deleteQuery = `
						DELETE FROM carts_products
						WHERE cart_id = $1 AND product_id = $2;
					`;

					await client.query(deleteQuery, [cartId, existingItem.product_id]);
				}
			}

			for (const newItem of consolidatedItems) {
				const existingItem = existingItems.find(i => i.product_id === newItem.productId);

				// If no existing item exists that matches the new item, insert the new item
				if (!existingItem) {
					const insertQuery = `
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

					const insertResult = await client.query(insertQuery, [cartId, newItem.productId, newItem.count]);

					// Add inserted item to cart for return
					cart.items.push(mapDboCartItemToApiCartItem(insertResult.rows[0]));
				}
			}
		} else {
			// If no items were given to the function to update then we should fetch them for the returned cart
			const itemsQuery = `
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
				WHERE cp.cart_id = $1;
			`;

			const itemsResult = await client.query(itemsQuery, [cartId]);
			cart.items = itemsResult.rows.map(mapDboCartItemToApiCartItem);
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

/**
 * Order the items in the given cart belonging to the requesting user, and have them sent to the given address.
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} cartId The cart's ID
 * @param {number} addressId The ID of the address to which to send the order
 * @returns The ID of the order
 */
async function checkoutCart(requesterId, cartId, addressId) {
	// Create order with same items as the cart
	const cart = await getCartById(requesterId, cartId);

	const client = await db.getClient();

	try {
		// Check cart has not already been ordered
		if (cart.ordered) {
			throw { status: 400, message: 'Cart already ordered' };
		}

		// Check cart items' stock levels
		for (const item of cart.items) {
			const result = await client.query('SELECT stock_count FROM product WHERE id = $1', [item.product.id]);
			const stockCount = result.rows[0].stock_count;
			if (item.count > stockCount) {
				throw { status: 400, message: `Cart item "${item.product.name}" does not have enough stock left` };
			}
		}

		// Check the address exists and belongs to the requesting user
		const result = await client.query('SELECT id FROM address WHERE id = $1 AND account_id = $2', [addressId, requesterId]);
		if (result.rowCount === 0) {
			throw { status: 400, message: 'Given address ID not found' };
		}

		await client.query('BEGIN');

		// Create an order record
		const orderId = (await client.query(`
			INSERT INTO "order" (account_id, address_id)
			VALUES ($1, $2)
			RETURNING id;
		`,
		[requesterId, addressId]))
			.rows[0].id;

		// Create an orders_products record for each cart item
		for (const item of cart.items) {
			await client.query(`
				INSERT INTO orders_products (order_id, product_id, count)
				VALUES ($1, $2, $3);
			`,
			[orderId, item.product.id, item.count]);
		}

		// Mark cart as ordered
		await client.query(`
			UPDATE cart
			SET ordered = TRUE
			WHERE id = $1;
		`,
		[cartId]);

		// Reduce stock count for each item ordered
		for (const item of cart.items) {
			await client.query(`
				UPDATE product
				SET stock_count = stock_count - $2
				WHERE id = $1;
			`,
			[item.product.id, item.count]);
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
	getAllCarts,
	getCartById,
	createCartValidateInput,
	createCart,
	updateCartValidateInput,
	updateCart,
	deleteCart,
	checkoutCart,
	consolidateItems,
};
