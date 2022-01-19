const request = require('supertest');
const app = require('../../server');

describe('/account', () => {
	describe('get', () => {
		it('Returns account information', done => {
			request(app)
				.get('/account')
				.expect(200, done);
		});
	});
});
