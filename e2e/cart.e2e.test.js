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
	await db.query('DROP TABLE IF EXISTS pg_temp.account');
	await db.query('DROP TABLE IF EXISTS pg_temp.carts_products');
	await db.query('DROP TABLE IF EXISTS pg_temp.product');
	await db.query('DROP TABLE IF EXISTS pg_temp.address');
	await db.query('DROP TABLE IF EXISTS pg_temp."order"');
	await db.query('DROP TABLE IF EXISTS pg_temp.orders_products');
});

async function createTestUser() {
	const passwordHash = await bcrypt.hash('Password01', 10);
	const values = [1, 'David', 'Morgan', 'david.morgan@gmail.com', passwordHash];
	await db.query(
		'INSERT INTO account (id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
		values,
	);
}

async function loginTestUser() {
	const res = await request(app).post('/auth/login').send({
		email: 'david.morgan@gmail.com',
		password: 'Password01',
	});

	const cookie = res.headers['set-cookie'].find(c =>
		c.startsWith('connect.sid'),
	);

	return cookie;
}

describe('/cart', () => {
	describe('get', () => {
		it('Allows an authorized user to get his cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);

			await request(app)
				.get('/cart')
				.set('Cookie', cookie)
				.expect(200, {
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
			await request(app).get('/cart').expect(401);
		});

		it('Does not allow an authorized user to get cart items not belonging to them', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[2, 1, 1],
			);

			await request(app)
				.get('/cart')
				.set('Cookie', cookie)
				.expect(200, { items: [] });
		});
	});

	describe('put', () => {
		it("Allows an authorized user to update a cart's item's count", async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);

			const newCart = {
				items: [
					{
						productId: 1,
						count: 2,
					},
				],
			};

			await request(app)
				.put('/cart')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
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
					],
				});
		});

		it('Allows an authorized user to remove items from a cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);

			const newCart = {
				items: [],
			};

			await request(app)
				.put('/cart')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
					items: [],
				});
		});

		it('Allows an authorized user to add items to a cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

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

			const newCart = {
				items: [
					{
						productId: 1,
						count: 1,
					},
					{
						productId: 2,
						count: 1,
					},
				],
			};

			await request(app)
				.put('/cart')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
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

		it('Consolidates items in the cart input', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

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

			const newCart = {
				items: [
					{
						productId: 2,
						count: 1,
					},
					{
						productId: 1,
						count: 2,
					},
					{
						productId: 2,
						count: 2,
					},
				],
			};

			await request(app)
				.put('/cart')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
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
	});
});

describe('/cart/checkout', () => {
	describe('post', () => {
		it('Allows an authorized user to check out their cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			const response = await request(app)
				.post('/cart/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(200);

			expect(response.status).toEqual(200);
			expect(response.body).toHaveProperty('orderId');
			expect(response.body.orderId).toEqual(expect.any(Number));
		});

		it('Rejects if an address does not exist', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			await request(app)
				.post('/cart/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 2,
				})
				.expect(400);
		});

		it('Rejects if the given address does not belong to the authorized user', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 1],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				2,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			await request(app)
				.post('/cart/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(400);
		});

		it("Rejects if an item's stock count is too low to order", async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);
			await db.query(
				'INSERT INTO carts_products VALUES ($1, $2, $3)',
				[1, 1, 24],
			);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				1,
				'Pendennis',
				'Tredegar Road',
				'Ebbw Vale',
				'NP23 6LP',
			]);

			await request(app)
				.post('/cart/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(400);
		});
	});
});
