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

jest.mock('../../db/index', () => {
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
	await mockPool.query('CREATE TEMPORARY TABLE cart (LIKE cart INCLUDING ALL)');
	await mockPool.query('CREATE TEMPORARY TABLE carts_products (LIKE carts_products INCLUDING ALL)');
	await mockPool.query('CREATE TEMPORARY TABLE product (LIKE product INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.cart');
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.carts_products');
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.product');
});

describe('Cart service', () => {
	describe('getAllCarts', () => {
		it('gets all the carts', async () => {
			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [2, 1, 'Christmas Cart', '2004-10-20 10:23:54', true]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [2, 2, 1]);

			const requesterId = 1;

			const result = await cartService.getAllCarts(requesterId);

			expect(result).toMatchObject([
				{
					id: 1,
					createdAt: new Date('2004-10-19 10:23:54'),
					name: 'My Cart',
					ordered: false,
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
				},
				{
					id: 2,
					createdAt: new Date('2004-10-20 10:23:54'),
					name: 'Christmas Cart',
					ordered: true,
					items: [
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
				},
			]);
		});

		it('works if a cart has no items', async () => {
			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);

			const requesterId = 1;

			const result = await cartService.getAllCarts(requesterId);

			expect(result).toMatchObject([
				{
					id: 1,
					createdAt: new Date('2004-10-19 10:23:54'),
					name: 'My Cart',
					ordered: false,
					items: [],
				}
			]);
		});

		it('doesn\'t get carts not belonging to the requesting user', async () => {
			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 2, 'My Cart', '2004-10-19 10:23:54', false]);

			const requesterId = 1;

			const result = await cartService.getAllCarts(requesterId);

			expect(result).toMatchObject([]);
		});
	});
});
