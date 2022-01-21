const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/account-service');

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
				.send({
					first_name: 'David',
					last_name: 'Morgan',
					email: 'david.morgan@gmail.com',
					password: 'Password01',
				})
				.expect(200, done);
		});

		it('returns status 400 with no input', done => {
			request(app)
				.post('/auth/register')
				.expect(400, done);
		});

		it('returns status 400 with invalid email', done => {
			request(app)
				.post('/auth/register')
				.send({
					first_name: 'David',
					last_name: 'Morgan',
					email: '@gmail.com',
					password: 'Password01',
				})
				.expect(400, done);
		});
	});
});
