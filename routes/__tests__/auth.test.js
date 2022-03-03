const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/auth-service');
jest.mock('../../services/account-service');

describe('/auth/login', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app)
				.post('/auth/login')
				.send({
					email: 'david.morgan@gmail.com',
					password: 'Password01',
				})
				.expect(200, done);
		});

		it('returns status 401 if user doesn\'t exist', done => {
			request(app)
				.post('/auth/login')
				.send({
					email: 'nonexistantuser@gmail.com',
					password: 'Password01',
				})
				.expect(401, done);
		});

		it('returns status 401 with no input', done => {
			request(app)
				.post('/auth/login')
				.expect(401, done);
		});
	});
});

describe('/auth/register', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app)
				.post('/auth/register')
				.send({
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgan@gmail.com',
					password: 'Password01',
				})
				.expect(200, {
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgan@gmail.com',
				}, done);
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
					firstName: 'David',
					lastName: 'Morgan',
					email: '@gmail.com',
					password: 'Password01',
				})
				.expect(400, done);
		});
	});
});
