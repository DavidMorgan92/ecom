const db = require('../db/index');
const { mapDboAddressToApiAddress } = require('./address-service');
const { mapDboProductToApiProduct } = require('./product-service');

/**
 * Convert a database representation of an order into an API representation
 * @param {object} order The order object as returned from the database
 * @returns An object that represents the order at the API level
 */
function mapDboOrderToApiOrder(order) {
	return {
		id: order.id,
		createdAt: order.created_at,
		address: mapDboAddressToApiAddress(order.address),
		items: order.items.map(mapDboOrderItemToApiOrderItem),
	};
}

/**
 * Convert a database representation of an order item into an API representation
 * @param {object} orderItem The order item object as returned from the database
 * @returns An object that represents the order item at the API level
 */
function mapDboOrderItemToApiOrderItem(orderItem) {
	return {
		count: orderItem.count,
		product: mapDboProductToApiProduct(orderItem.product),
	};
}

/**
 * Get all the requesting user's order objects
 * @param {number} requesterId Account ID of the requesting user
 * @returns Array of orders belonging to the requesting user
 */
async function getAllOrders(requesterId) {
	const query = `
		SELECT o.id, o.created_at,
		(
			SELECT row_to_json(x) FROM
			(
				SELECT a.id, a.house_name_number, a.street_name, a.town_city_name, a.post_code
				FROM address a
				WHERE a.id = o.address_id
			) x
		) AS address,
		(
			SELECT array_to_json(array_agg(y)) FROM
			(
				SELECT op.count,
				(
					SELECT row_to_json(z) FROM
					(
						SELECT p.id, p.name, p.description, p.category, p.price, p.stock_count
						FROM product p
						WHERE op.product_id = p.id
					) z
				) AS product
				FROM orders_products op
				WHERE op.order_id = o.id
			) y
		) AS items
		FROM "order" o
		WHERE o.account_id = $1;
	`;

	const values = [requesterId];

	const result = await db.query(query, values);

	return result.rows.map(mapDboOrderToApiOrder);
}

module.exports = {
	getAllOrders,
};
