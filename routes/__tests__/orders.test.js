const request = require('supertest');
const app = require('../../server');

describe('/orders', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/orders')
				.expect(200, done);
		});
	});
});

describe('/orders/:orderId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/orders/1')
				.expect(200, done);
		});
	});
});
