const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../server');
const db = require('../db');

// Create a new pool with a connection limit of 1
const mockPool = new Pool({
	database: 'ecom',
	user: 'postgres',
	password: 'postgres',
	port: 5432,
	max: 1, // Reuse the connection to make sure we always hit the same temporal schema
	idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
});

jest.mock('../db', () => {
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
	await db.query('CREATE TEMPORARY TABLE account (LIKE account INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE product (LIKE product INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE address (LIKE address INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE "order" (LIKE "order" INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE orders_products (LIKE orders_products INCLUDING ALL)');
});

afterEach(async () => {
	await db.query('DROP TABLE IF EXISTS pg_temp.account');
	await db.query('DROP TABLE IF EXISTS pg_temp.product');
	await db.query('DROP TABLE IF EXISTS pg_temp.address');
	await db.query('DROP TABLE IF EXISTS pg_temp."order"');
	await db.query('DROP TABLE IF EXISTS pg_temp.orders_products');
});

async function createTestUser() {
	const passwordHash = await bcrypt.hash('Password01', 10);
	const values = [1, 'David', 'Morgan', 'david.morgan@gmail.com', passwordHash];
	await db.query('INSERT INTO account (id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)', values);
}

async function loginTestUser() {
	const res = await request(app)
		.post('/auth/login')
		.send({
			email: 'david.morgan@gmail.com',
			password: 'Password01',
		});

	const cookie = res.headers['set-cookie'].find(c => c.startsWith('connect.sid'));

	return cookie;
}

describe('/orders', () => {
	describe('get', () => {
		it('Allows an authorized user to get all their orders', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [1, 1, 1, '2004-10-19 10:23:54']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [2, 1, 1, '2004-10-20 10:23:54']);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [2, 2, 1]);

			await request(app)
				.get('/orders')
				.set('Cookie', cookie)
				.expect(200, [
					{
						id: 1,
						createdAt: '2004-10-19T09:23:54.000Z',
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
						createdAt: '2004-10-20T09:23:54.000Z',
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

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/orders')
				.expect(401);
		});

		it('Does not get carts not belonging to the authorized user', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [1, 1, 1, '2004-10-19 10:23:54']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [2, 2, 1, '2004-10-20 10:23:54']);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [2, 2, 1]);

			await request(app)
				.get('/orders')
				.set('Cookie', cookie)
				.expect(200, [
					{
						id: 1,
						createdAt: '2004-10-19T09:23:54.000Z',
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
				]);
		});
	});
});

describe('/orders/:orderId', () => {
	describe('get', () => {
		it('Allows an authorized user to get an order', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [1, 1, 1, '2004-10-19 10:23:54']);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.get('/orders/1')
				.set('Cookie', cookie)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
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
				});
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/orders/1')
				.expect(401);
		});

		it('Returns 404 for non-existant orders', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [1, 1, 1, '2004-10-19 10:23:54']);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.get('/orders/2')
				.set('Cookie', cookie)
				.expect(404);
		});

		it('Returns 404 for orders not belonging to the authorized user', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 2, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);
			await db.query('INSERT INTO "order" VALUES ($1, $2, $3, $4)', [1, 2, 1, '2004-10-19 10:23:54']);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO orders_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.get('/orders/1')
				.set('Cookie', cookie)
				.expect(404);
		});
	});
});
