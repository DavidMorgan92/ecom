const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/account-service');

describe('/account', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/account')
				.expect(200, done);
		});
	});

	describe('put', () => {
		it('returns status 200', done => {
			request(app)
				.put('/account')
				.expect(200, done);
		});
	});
});
