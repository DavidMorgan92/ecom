const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/address-service');
jest.mock('../../services/auth-service');

describe('/addresses', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/addresses')
				.expect(
					200,
					[
						{
							id: '1',
							houseNameNumber: 'Pendennis',
							streetName: 'Tredegar Road',
							townCityName: 'Ebbw Vale',
							postCode: 'NP23 6LP',
						},
					],
					done,
				);
		});
	});

	describe('post', () => {
		it('returns status 201', done => {
			request(app)
				.post('/addresses')
				.send({
					houseNameNumber: 'Pendennis',
					streetName: 'Tredegar Road',
					townCityName: 'Ebbw Vale',
					postCode: 'NP23 6LP',
				})
				.expect(
					201,
					{
						id: '1',
						houseNameNumber: 'Pendennis',
						streetName: 'Tredegar Road',
						townCityName: 'Ebbw Vale',
						postCode: 'NP23 6LP',
					},
					done,
				);
		});

		it('returns status 400 with no input', done => {
			request(app).post('/addresses').expect(400, done);
		});
	});
});

describe('/addresses/:addressId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app).get('/addresses/1').expect(
				200,
				{
					id: '1',
					houseNameNumber: 'Pendennis',
					streetName: 'Tredegar Road',
					townCityName: 'Ebbw Vale',
					postCode: 'NP23 6LP',
				},
				done,
			);
		});

		it("returns status 404 if the address doesn't exist", done => {
			request(app).get('/addresses/2').expect(404, done);
		});
	});

	describe('put', () => {
		it('returns status 200', done => {
			request(app)
				.put('/addresses/1')
				.send({
					houseNameNumber: '3',
					streetName: "St John's Court",
					townCityName: 'Merthyr Tydfil',
					postCode: 'CF48 3LU',
				})
				.expect(
					200,
					{
						id: '1',
						houseNameNumber: '3',
						streetName: "St John's Court",
						townCityName: 'Merthyr Tydfil',
						postCode: 'CF48 3LU',
					},
					done,
				);
		});

		it('returns status 400 with no input', done => {
			request(app).put('/addresses/1').expect(400, done);
		});

		it("returns status 404 if the address doesn't exist", done => {
			request(app).put('/addresses/2').expect(404, done);
		});
	});

	describe('delete', () => {
		it('returns status 204', done => {
			request(app).delete('/addresses/1').expect(204, done);
		});

		it("returns status 404 if the address doesn't exist", done => {
			request(app).put('/addresses/2').expect(404, done);
		});
	});
});
