const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/address-service');

describe('/addresses', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/addresses')
				.expect(200, [{
					id: 1,
					houseNameNumber: 'Pendennis',
					streetName: 'Tredegar Road',
					townCityName: 'Ebbw Vale',
					postCode: 'NP23 6LP',
				}], done);
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
				.expect(200, {
					id: 1,
					houseNameNumber: 'Pendennis',
					streetName: 'Tredegar Road',
					townCityName: 'Ebbw Vale',
					postCode: 'NP23 6LP',
				}, done);
		});

		it('returns status 404 if the address doesn\'t exist', done => {
			request(app)
				.get('/addresses/2')
				.expect(404, done);
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
