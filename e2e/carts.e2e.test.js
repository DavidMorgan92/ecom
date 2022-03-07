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
	await db.query('CREATE TEMPORARY TABLE cart (LIKE cart INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE carts_products (LIKE carts_products INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE product (LIKE product INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE address (LIKE address INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE "order" (LIKE "order" INCLUDING ALL)');
	await db.query('CREATE TEMPORARY TABLE orders_products (LIKE orders_products INCLUDING ALL)');
});

afterEach(async () => {
	await db.query('DROP TABLE IF EXISTS pg_temp.account');
	await db.query('DROP TABLE IF EXISTS pg_temp.cart');
	await db.query('DROP TABLE IF EXISTS pg_temp.carts_products');
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

describe('/carts', () => {
	describe('get', () => {
		it('Allows an authorized user to get their carts', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [2, 1, 'Christmas Cart', '2004-10-20 10:23:54', true]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [2, 2, 1]);

			await request(app)
				.get('/carts')
				.set('Cookie', cookie)
				.expect(200, [
					{
						id: 1,
						createdAt: '2004-10-19T09:23:54.000Z',
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
						createdAt: '2004-10-20T09:23:54.000Z',
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

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/carts')
				.expect(401);
		});

		it('Does not get carts not belonging to the authorized user', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [2, 2, 'Christmas Cart', '2004-10-20 10:23:54', true]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [2, 2, 1]);

			await request(app)
				.get('/carts')
				.set('Cookie', cookie)
				.expect(200, [
					{
						id: 1,
						createdAt: '2004-10-19T09:23:54.000Z',
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
				]);
		});
	});

	describe('post', () => {
		it('Allows an authorized user to create a cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);

			const cart = {
				name: 'My Cart',
				items: [
					{ productId: 1, count: 1 },
					{ productId: 2, count: 2 },
				],
			};

			const response = await request(app)
				.post('/carts')
				.set('Cookie', cookie)
				.send(cart);

			expect(response.status).toEqual(201);
			expect(response.body).toHaveProperty('id');
			expect(response.body.id).toEqual(expect.any(Number));
			expect(response.body).toHaveProperty('createdAt');
			expect(response.body).toMatchObject({
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
					{
						count: 2,
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

		it('Rejects unauthorized users', async () => {
			const cart = {
				name: 'My Cart',
				items: [
					{ productId: 1, count: 1 },
					{ productId: 2, count: 2 },
				],
			};

			await request(app)
				.post('/carts')
				.send(cart)
				.expect(401);
		});

		it('Rejects cart with no name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const cart = {
				name: '',
				items: [
					{ productId: 1, count: 1 },
					{ productId: 2, count: 2 },
				],
			};

			await request(app)
				.post('/carts')
				.set('Cookie', cookie)
				.send(cart)
				.expect(400);
		});

		it('Rejects cart with item with no product ID', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const cart = {
				name: 'My Cart',
				items: [
					{ count: 1 },
					{ productId: 2, count: 2 },
				],
			};

			await request(app)
				.post('/carts')
				.set('Cookie', cookie)
				.send(cart)
				.expect(400);
		});

		it('Rejects cart with item with no count', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const cart = {
				name: 'My Cart',
				items: [
					{ productId: 1, count: 1 },
					{ productId: 2 },
				],
			};

			await request(app)
				.post('/carts')
				.set('Cookie', cookie)
				.send(cart)
				.expect(400);
		});
	});
});

describe('/carts/:cartId', () => {
	describe('get', () => {
		it('Allows an authorized user to get a cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.get('/carts/1')
				.set('Cookie', cookie)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
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
				});
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/carts/1')
				.expect(401);
		});

		it('Returns 404 for non-existant carts', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.get('/carts/2')
				.set('Cookie', cookie)
				.expect(404);
		});

		it('Does not allow an authorized user to get a cart not belonging to them', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 2, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.get('/carts/1')
				.set('Cookie', cookie)
				.expect(404);
		});
	});

	describe('put', () => {
		it('Allows an authorized user to update a cart\'s name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'New Cart Name',
			};

			await request(app)
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'New Cart Name',
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
				});
		});

		it('Allows an authorized user to update a cart\'s item\'s count', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'My Cart',
				items: [
					{
						productId: 1,
						count: 2,
					},
				],
			};

			await request(app)
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'My Cart',
					ordered: false,
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

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'My Cart',
				items: [],
			};

			await request(app)
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'My Cart',
					ordered: false,
					items: [],
				});
		});

		it('Allows an authorized user to add items from a cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'My Cart',
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
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
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

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'My Cart',
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
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'My Cart',
					ordered: false,
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

		it('Rejects a blank cart name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: '',
			};

			await request(app)
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(400);
		});

		it('Rejects unauthorized users', async () => {
			const newCart = {
				name: 'New Cart Name',
			};

			await request(app)
				.put('/carts/1')
				.send(newCart)
				.expect(401);
		});

		it('Returns 404 for non-existant carts', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'New Cart Name',
			};

			await request(app)
				.put('/carts/2')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(404);
		});

		it('Does not allow authorized users to update carts not belonging to them', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 2, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			const newCart = {
				name: 'New Cart Name',
			};

			await request(app)
				.put('/carts/1')
				.set('Cookie', cookie)
				.send(newCart)
				.expect(404);
		});
	});

	describe('delete', () => {
		it('Allows an authorized user to delete a cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.delete('/carts/1')
				.set('Cookie', cookie)
				.expect(204);
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.delete('/carts/1')
				.expect(401);
		});

		it('Returns 404 for non-existant carts', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.delete('/carts/2')
				.set('Cookie', cookie)
				.expect(404);
		});

		it('Does not allow an authorized user to delete a cart not belonging to them', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 2, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);

			await request(app)
				.delete('/carts/1')
				.set('Cookie', cookie)
				.expect(404);
		});
	});
});

describe('/carts/:cartId/checkout', () => {
	describe('post', () => {
		it('Allows an authorized user to check out their cart', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			const response = await request(app)
				.post('/carts/1/checkout')
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

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			await request(app)
				.post('/carts/1/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 2,
				})
				.expect(400);
		});

		it('Rejects if the given address does not belong to the authorized user', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 2, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			await request(app)
				.post('/carts/1/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(400);
		});

		it('Rejects if an item\'s stock count is too low to order', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 24]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			await request(app)
				.post('/carts/1/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(400);
		});

		it('Rejects if a cart has already been ordered', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', true]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			await request(app)
				.post('/carts/1/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(400);
		});

		it('Returns 404 for non-existant carts', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 1, 'My Cart', '2004-10-19 10:23:54', true]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			await request(app)
				.post('/carts/2/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(404);
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.post('/carts/1/checkout')
				.send({
					addressId: 1,
				})
				.expect(401);
		});

		it('Does not allow an authorized user to checkout a cart not belonging to them', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await db.query('INSERT INTO cart VALUES ($1, $2, $3, $4, $5)', [1, 2, 'My Cart', '2004-10-19 10:23:54', false]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO carts_products VALUES ($1, $2, $3)', [1, 1, 1]);
			await db.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', [1, 1, 'Pendennis', 'Tredegar Road', 'Ebbw Vale', 'NP23 6LP']);

			await request(app)
				.post('/carts/1/checkout')
				.set('Cookie', cookie)
				.send({
					addressId: 1,
				})
				.expect(404);
		});
	});
});
