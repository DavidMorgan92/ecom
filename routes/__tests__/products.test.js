const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/product-service');
jest.mock('../../services/auth-service');

describe('/products/categories', () => {
	describe('get', () => {
		it('gets all categories', done => {
			request(app)
				.get('/products/categories')
				.expect(200, ['Bathroom', 'Health & Beauty'], done);
		});
	});
});

describe('/products', () => {
	describe('get', () => {
		it('returns all products', done => {
			request(app)
				.get('/products')
				.expect(
					200,
					[
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
					],
					done,
				);
		});
	});

	describe('post', () => {
		it('creates a product', async () => {
			const response = await request(app).post('/products').send({
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			});

			expect(response.status).toEqual(201);
			expect(response.body).toMatchObject({
				name: 'Sardines',
				description: 'Canned fish',
				category: 'Food',
				pricePennies: '300',
				stockCount: 10,
			});

			expect(response.body).toHaveProperty('id');
			expect(response.body.id).toEqual(expect.any(Number));
		});

		it('returns status 400 with no input', done => {
			request(app).post('/products').expect(400, done);
		});
	});
});

describe('/products?name=', () => {
	describe('get', () => {
		it('returns products with matching name', done => {
			request(app)
				.get('/products?name=Toothbrush')
				.expect(
					200,
					[
						{
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: '123',
							stockCount: 23,
						},
					],
					done,
				);
		});

		it('returns products with partially matching names', done => {
			request(app)
				.get('/products?name=brush')
				.expect(
					200,
					[
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
					],
					done,
				);
		});
	});
});

describe('/products?category=', () => {
	describe('get', () => {
		it('returns products with matching category', done => {
			request(app)
				.get('/products?category=Health %26 Beauty')
				.expect(
					200,
					[
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
					],
					done,
				);
		});

		it('returns products with partially matching category', done => {
			request(app)
				.get('/products?category=Health')
				.expect(
					200,
					[
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
					],
					done,
				);
		});
	});
});

describe('/products?name=&category=', () => {
	describe('get', () => {
		it('returns products with matching name and category', done => {
			request(app)
				.get('/products?name=Toothbrush&category=Health %26 Beauty')
				.expect(
					200,
					[
						{
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: '123',
							stockCount: 23,
						},
					],
					done,
				);
		});
	});
});

describe('/products?id=', () => {
	describe('get', () => {
		it('returns product with matching ID', done => {
			request(app)
				.get('/products?id=1')
				.expect(
					200,
					[
						{
							id: 1,
							name: 'Toothbrush',
							description: 'Bristly',
							category: 'Health & Beauty',
							pricePennies: '123',
							stockCount: 23,
						},
					],
					done,
				);
		});
	});
});

describe('/products?id=&id=&id=', () => {
	describe('get', () => {
		it('returns products with matching IDs', done => {
			request(app)
				.get('/products?id=1&id=2&id=3')
				.expect(
					200,
					[
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
					],
					done,
				);
		});
	});
});

describe('/products?name=&category=&id=', () => {
	describe('get', () => {
		it('returns product with matching ID, overriding name and category search', done => {
			request(app)
				.get('/products?name=Toothbrush&category=Health %26 Beauty&id=3')
				.expect(
					200,
					[
						{
							id: 3,
							name: 'Toiletbrush',
							description: 'Bristly',
							category: 'Bathroom',
							pricePennies: '321',
							stockCount: 21,
						},
					],
					done,
				);
		});
	});
});

describe('/products/:productId', () => {
	describe('get', () => {
		it('returns product with matching ID', done => {
			request(app).get('/products/1').expect(
				200,
				{
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '123',
					stockCount: 23,
				},
				done,
			);
		});

		it("returns status 404 if the product doesn't exist", done => {
			request(app).get('/products/1000').expect(404, done);
		});
	});
});
