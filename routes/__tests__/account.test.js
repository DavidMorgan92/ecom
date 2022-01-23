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
				.send({
					firstName: 'David',
					lastName: 'Morgan',
				})
				.expect(200, done);
		});

		it('returns status 400 with no input', done => {
			request(app)
				.put('/account')
				.expect(400, done);
		});

		it ('returns status 400 with empty first name', done => {
			request(app)
				.put('/account')
				.send({
					firstName: '',
					lastName: 'Morgan',
				})
				.expect(400, done);
		});

		it ('returns status 400 with empty last name', done => {
			request(app)
				.put('/account')
				.send({
					firstName: 'David',
					lastName: '',
				})
				.expect(400, done);
		});
	});
});
