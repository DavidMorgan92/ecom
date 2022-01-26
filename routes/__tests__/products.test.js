const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/product-service');

describe('/products', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products')
				.expect(200, done);
		});
	});
});

describe('/products?name=', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products?name="Toothbrush"')
				.expect(200, done);
		});
	});
});

describe('/products?category=', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products?category="Health & Beauty"')
				.expect(200, done);
		});
	});
});

describe('/products?name=&category=', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products?name="Toothbrush"&category="Health & Beauty"')
				.expect(200, done);
		});
	});
});

describe('/products?id=', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products?id=1')
				.expect(200, done);
		});
	});
});

describe('/products?id=&id=&id=', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products?id=1&id=2&id=3')
				.expect(200, done);
		});
	});
});

describe('/products?name=&category=&id=', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products?name="Toothbrush"&category="Health & Beauty"&id=1')
				.expect(200, done);
		});
	});
});

describe('/products/:productId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/products/1')
				.expect(200, {
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '123',
					stockCount: 23,
				}, done);
		});

		it('returns status 404 if the product doesn\'t exist', done => {
			request(app)
				.get('/products/2')
				.expect(404, done);
		});
	});
});
