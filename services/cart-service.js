const db = require('../db/index');
const { mapDboProductToApiProduct } = require('./product-service');

function mapDboCartToApiCart(cart) {
	return {
		id: cart.id,
		createdAt: cart.created_at,
		name: cart.name,
		ordered: cart.ordered,
		items: cart.items ? cart.items.map(mapDboCartItemToApiCartItem) : [],
	};
}

function mapDboCartItemToApiCartItem(cartItem) {
	return {
		count: cartItem.count,
		product: mapDboProductToApiProduct(cartItem.product),
	};
}

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

module.exports = {
	getAllCarts,
	getCartById,
	createCartValidateInput,
	createCart,
};
