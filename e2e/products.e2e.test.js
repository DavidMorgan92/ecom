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
});

afterEach(async () => {
	await db.query('DROP TABLE IF EXISTS pg_temp.account');
	await db.query('DROP TABLE IF EXISTS pg_temp.product');
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

async function createTestAdmin() {
	const passwordHash = await bcrypt.hash('Password01', 10);
	const values = [1, 'Admin', 'Admin', 'admin@gmail.com', passwordHash, true];
	await db.query(
		'INSERT INTO account (id, first_name, last_name, email, password_hash, is_admin) VALUES ($1, $2, $3, $4, $5, $6)',
		values,
	);
}

async function loginTestAdmin() {
	const res = await request(app).post('/auth/login').send({
		email: 'admin@gmail.com',
		password: 'Password01',
	});

	const cookie = res.headers['set-cookie'].find(c =>
		c.startsWith('connect.sid'),
	);

	return cookie;
}

describe('/products', () => {
	describe('get', () => {
		it('Allows a user to get all products', async () => {
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

			await request(app)
				.get('/products')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
				]);
		});

		it('Allows a user to get a single product by ID', async () => {
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

			await request(app)
				.get('/products?id=1')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
				]);
		});

		it('Allows a user to get products by ID', async () => {
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

			await request(app)
				.get('/products?id=1&id=2')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
				]);
		});

		it('Works if IDs are not found', async () => {
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

			await request(app)
				.get('/products?id=1&id=2&id=3')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
				]);
		});

		it('Overrides name and category search with IDs if specified', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?name=Toothbrush&category=Health %26 Beauty&id=3')
				.expect(200, [
					{
						id: 3,
						name: 'Toiletbrush',
						description: 'Bristly',
						category: 'Bathroom',
						pricePennies: '321',
						stockCount: 21,
					},
				]);
		});

		it('Returns product with matching name', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?name=Toothbrush')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
				]);
		});

		it('Returns products with partially matching names', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?name=bRuSh')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
					{
						id: 3,
						name: 'Toiletbrush',
						description: 'Bristly',
						category: 'Bathroom',
						pricePennies: '321',
						stockCount: 21,
					},
				]);
		});

		it('Returns products with matching category', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?category=Health %26 Beauty')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
				]);
		});

		it('Returns products with partially matching categories', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?category=HeAlTh')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
				]);
		});

		it('Returns products with matching name and category', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?name=Toothbrush&category=Health %26 Beauty')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
				]);
		});

		it('Returns products with partially matching names and categories', async () => {
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
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				3,
				'Toiletbrush',
				'Bristly',
				'Bathroom',
				321,
				21,
			]);

			await request(app)
				.get('/products?name=BrUsH&category=HeAlTh')
				.expect(200, [
					{
						id: 1,
						name: 'Toothbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '123',
						stockCount: 23,
					},
					{
						id: 2,
						name: 'Hairbrush',
						description: 'Bristly',
						category: 'Health & Beauty',
						pricePennies: '234',
						stockCount: 12,
					},
				]);
		});
	});

	describe('post', () => {
		it('Allows an authorized admin to create a product', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			};

			const response = await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product);

			expect(response.status).toEqual(201);
			expect(response.body).toHaveProperty('id');
			expect(response.body.id).toEqual(expect.any(Number));
			expect(response.body).toMatchObject(product);
		});

		it('Rejects non-admin users', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(403);
		});

		it('Rejects unauthorized users', async () => {
			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			};

			await request(app).post('/products').send(product).expect(401);
		});

		it('Rejects product with no name', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: '',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});

		it('Rejects product with no description', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: '',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});

		it('Rejects product with no category', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: '',
				pricePennies: '300',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});

		it('Rejects product with no price', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});

		it('Rejects product with price < 0', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '-1',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});

		it('Rejects product with fractional price', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '3.00',
				stockCount: 10,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(500);
		});

		it('Rejects product with no stock count', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: '',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});

		it('Rejects product with stock count < 0', async () => {
			await createTestAdmin();
			const cookie = await loginTestAdmin();

			const product = {
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: -1,
			};

			await request(app)
				.post('/products')
				.set('Cookie', cookie)
				.send(product)
				.expect(400);
		});
	});
});

describe('/products/:productId', () => {
	describe('get', () => {
		it('Allows a user to get a product by its ID', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);

			await request(app).get('/products/1').expect(200, {
				id: 1,
				name: 'Toothbrush',
				description: 'Bristly',
				category: 'Health & Beauty',
				pricePennies: '123',
				stockCount: 23,
			});
		});

		it('Returns 404 if a product does not exist', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [
				1,
				'Toothbrush',
				'Bristly',
				'Health & Beauty',
				123,
				23,
			]);

			await request(app).get('/products/2').expect(404);
		});
	});
});
