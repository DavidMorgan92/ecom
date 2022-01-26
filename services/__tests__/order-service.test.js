const { Pool } = require('pg');
const db = require('../../db');
const orderService = require('../order-service');

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
	await mockPool.query('CREATE TEMPORARY TABLE address (LIKE address INCLUDING ALL)');
	await mockPool.query('CREATE TEMPORARY TABLE "order" (LIKE "order" INCLUDING ALL)');
	await mockPool.query('CREATE TEMPORARY TABLE orders_products (LIKE orders_products INCLUDING ALL)');
	await mockPool.query('CREATE TEMPORARY TABLE product (LIKE product INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.address');
	await mockPool.query('DROP TABLE IF EXISTS pg_temp."order"');
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.orders_products');
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.product');
});

describe('Order service', () => {
	describe('getAllOrders', () => {
		it('gets all the orders', async () => {
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, null, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [1, 1, 1, '2004-10-19 10:23:54']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [2, 1, 1, '2004-10-20 10:23:54']);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [2, 2, 1]);

			const requesterId = 1;

			const result = await orderService.getAllOrders(requesterId);

			expect(result).toMatchObject([
				{
					id: 1,
					createdAt: new Date('2004-10-19 10:23:54'),
					address: {
						id: 1,
						houseNameNumber: 'Pendennis',
						streetName: 'Tredegar Road',
						townCityName: 'Ebbw Vale',
						postCode: 'NP23 6LP',
					},
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
					address: {
						id: 1,
						houseNameNumber: 'Pendennis',
						streetName: 'Tredegar Road',
						townCityName: 'Ebbw Vale',
						postCode: 'NP23 6LP',
					},
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
	});
});
