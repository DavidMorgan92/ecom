const { Pool } = require('pg');
const db = require('../../db');
const cartService = require('../cart-service');

// Create a new pool with a connection limit of 1
const mockPool = new Pool({
	database: 'ecom',
	user: 'postgres',
	password: 'postgres',
	port: 5432,
	max: 1, // Reuse the connection to make sure we always hit the same temporal schema
	idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
});

jest.mock('../../db', () => {
	return {
		async query(text, params) {
			return await mockPool.query(text, params);
		},

		async getClient() {
			return await mockPool.connect();
		},
	};
});

afterAll(async () => {
	await mockPool.end();
});

beforeEach(async () => {
	await db.query(
		'CREATE TEMPORARY TABLE carts_products (LIKE carts_products INCLUDING ALL)',
	);
	await db.query('CREATE TEMPORARY TABLE product (LIKE product INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE address (LIKE address INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE "order" (LIKE "order" INCLUDING ALL)');
	await db.query(
		'CREATE TEMPORARY TABLE orders_products (LIKE orders_products INCLUDING ALL)',
	);
});

afterEach(async () => {
	await db.query('DROP TABLE IF EXISTS pg_temp.carts_products');
	await db.query('DROP TABLE IF EXISTS pg_temp.product');
	await db.query('DROP TABLE IF EXISTS pg_temp.address');
	await db.query('DROP TABLE IF EXISTS pg_temp."order"');
	await db.query('DROP TABLE IF EXISTS pg_temp.orders_products');
});

describe('Cart service', () => {
	describe('getCart', () => {
		it('gets cart information', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[2, 2, 1],
			);

			const requesterId = 1;

			const result = await cartService.getCart(requesterId);

			expect(result).toMatchObject({
				items: [
					{
						count: 1,
						product: {
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: 123,
							stockCount: 23,
						},
					},
				],
			});
		});

		it('works if there are no items', async () => {
			const requesterId = 1;

			const result = await cartService.getCart(requesterId);

			expect(result).toMatchObject({
				items: [],
			});
		});
	});

	describe('checkoutCart', () => {
		it('checks out a cart', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 2, 1],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			const requesterId = 1;
			const addressId = 1;

			const orderId = await cartService.checkoutCart(
				requesterId,
				addressId,
				'payment_id',
			);

			expect(orderId).toEqual(expect.any(Number));

			const product1stock = (
				await db.query('SELECT stock_count FROM product WHERE id = 1')
			).rows[0].stock_count;
			expect(product1stock).toEqual(22);

			const product2stock = (
				await db.query('SELECT stock_count FROM product WHERE id = 2')
			).rows[0].stock_count;
			expect(product2stock).toEqual(11);
		});

		it('throws if cart is empty', async () => {
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			const requesterId = 1;
			const addressId = 1;

			await expect(
				cartService.checkoutCart(requesterId, addressId, 'payment_id'),
			).rejects.toEqual({ status: 400, message: 'Cart is empty' });
		});

		it("throws if item doesn't have enough stock", async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 2, 24],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			const requesterId = 1;
			const addressId = 1;

			await expect(
				cartService.checkoutCart(requesterId, addressId, 'payment_id'),
			).rejects.toEqual({
				status: 400,
				message: 'Cart item "Hairbrush" does not have enough stock left',
			});
		});

		it('throws if address ID does not exist', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 2, 1],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			const requesterId = 1;
			const addressId = 2;

			await expect(
				cartService.checkoutCart(requesterId, addressId, 'payment_id'),
			).rejects.toEqual({ status: 400, message: 'Given address ID not found' });
		});
	});

	describe('consolidateItems', () => {
		it('consolidates items', () => {
			const items = [
				{
					count: 1,
					productId: 1,
				},
				{
					count: 2,
					productId: 2,
				},
				{
					count: 3,
					productId: 2,
				},
				{
					count: 3,
					productId: 1,
				},
			];

			const result = cartService.consolidateItems(items);

			expect(result).toMatchObject([
				{
					count: 4,
					productId: 1,
				},
				{
					count: 5,
					productId: 2,
				},
			]);
		});
	});

	describe('updateCart', () => {
		it("updates the cart's items' counts", async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 2, 1],
			);

			const requesterId = 1;

			const newItems = [
				{
					productId: 1,
					count: 2,
				},
				{
					productId: 2,
					count: 3,
				},
			];

			const result = await cartService.updateCart(requesterId, newItems);

			expect(result).toMatchObject({
				items: [
					{
						count: 2,
						product: {
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: 123,
							stockCount: 23,
						},
					},
					{
						count: 3,
						product: {
							id: 2,
							name: 'Hairbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: 234,
							stockCount: 12,
						},
					},
				],
			});
		});

		it('removes items no longer in the cart', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 2, 1],
			);

			const requesterId = 1;

			const newItems = [
				{
					productId: 1,
					count: 1,
				},
			];

			const result = await cartService.updateCart(requesterId, newItems);

			expect(result).toMatchObject({
				items: [
					{
						count: 1,
						product: {
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: 123,
							stockCount: 23,
						},
					},
				],
			});
		});

		it('adds new items to the cart', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				2,
				'Hairbrush',
				'Bristly',
				'Health & Beauty',
				234,
				12,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);

			const requesterId = 1;

			const newItems = [
				{
					productId: 1,
					count: 1,
				},
				{
					productId: 2,
					count: 1,
				},
			];

			const result = await cartService.updateCart(requesterId, newItems);

			expect(result).toMatchObject({
				items: [
					{
						count: 1,
						product: {
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: 123,
							stockCount: 23,
						},
					},
					{
						count: 1,
						product: {
							id: 2,
							name: 'Hairbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: 234,
							stockCount: 12,
						},
					},
				],
			});
		});
	});
});
