const request = require('supertest');
const app = require('../../server');

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
				.expect(200, done);
		});
	});
});
