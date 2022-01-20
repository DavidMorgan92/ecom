const request = require('supertest');
const app = require('../../server');

describe('/addresses', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/addresses')
				.expect(200, done);
		});
	});

	describe('post', () => {
		it('returns status 201', done => {
			request(app)
				.post('/addresses')
				.expect(201, done);
		});
	});
});

describe('/addresses/:addressId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/addresses/1')
				.expect(200, done);
		});
	});

	describe('put', () => {
		it('returns status 200', done => {
			request(app)
				.put('/addresses/1')
				.expect(200, done);
		});
	});

	describe('delete', () => {
		it('returns status 204', done => {
			request(app)
				.delete('/addresses/1')
				.expect(204, done);
		});
	});
});
