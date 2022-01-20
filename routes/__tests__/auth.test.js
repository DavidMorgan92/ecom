const request = require('supertest');
const app = require('../../server');

describe('/auth/login', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app)
				.post('/auth/login')
				.expect(200, done);
		});
	});
});

describe('/auth/register', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app)
				.post('/auth/register')
				.expect(200, done);
		});
	});
});
