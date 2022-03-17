const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/order-service');
jest.mock('../../services/auth-service');

describe('/orders', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/orders')
				.expect(
					200,
					[
						{
							id: 1,
							createdAt: '2004-10-19T09:23:54.000Z',
							address: {
								id: 1,
								houseNameNumber: 'Pendennis',
								streetName: 'Tredegar Road',
								townCityName: 'Ebbw Vale',
								postCode: 'NP23 6LP',
							},
							items: [
								{
									count: 1,
									product: {
										id: 1,
										name: 'Toothbrush',
										description: 'Bristly',
										category: 'Health & Beauty',
										pricePennies: 123,
										stockCount: 23,
									},
								},
							],
						},
					],
					done,
				);
		});
	});
});

describe('/orders/:orderId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/orders/1')
				.expect(
					200,
					{
						id: 1,
						createdAt: '2004-10-19T09:23:54.000Z',
						address: {
							id: 1,
							houseNameNumber: 'Pendennis',
							streetName: 'Tredegar Road',
							townCityName: 'Ebbw Vale',
							postCode: 'NP23 6LP',
						},
						items: [
							{
								count: 1,
								product: {
									id: 1,
									name: 'Toothbrush',
									description: 'Bristly',
									category: 'Health & Beauty',
									pricePennies: 123,
									stockCount: 23,
								},
							},
						],
					},
					done,
				);
		});

		it("returns status 404 if the order doesn't exist", done => {
			request(app).get('/orders/2').expect(404, done);
		});
	});
});
