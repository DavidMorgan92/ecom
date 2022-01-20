const request = require('supertest');
const app = require('../../server');

describe('/carts', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/carts')
				.expect(200, done);
		});
	});

	describe('post', () => {
		it('returns status 201', done => {
			request(app)
				.post('/carts')
				.expect(201, done);
		});
	});
});

describe('/carts/:cartId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/carts/1')
				.expect(200, done);
		});
	});

	describe('put', () => {
		it('returns status 200', done => {
			request(app)
				.put('/carts/1')
				.expect(200, done);
		});
	});

	describe('delete', () => {
		it('returns status 204', done => {
			request(app)
				.delete('/carts/1')
				.expect(204, done);
		});
	});
});

describe('/carts/:cartId/checkout', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app)
				.post('/carts/1/checkout')
				.expect(200, done);
		});
	});
});
