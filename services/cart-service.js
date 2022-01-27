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

module.exports = {
	getAllCarts,
	getCartById,
};
