const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/cart-service');
jest.mock('../../services/auth-service');

describe('/cart', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/cart')
				.expect(
					200,
					{
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
	});

	describe('put', () => {
		it('returns status 200', done => {
			request(app)
				.put('/cart')
				.send({
					items: [
						{
							productId: 1,
							count: 1,
						},
						{
							productId: 2,
							count: 1,
						},
					],
				})
				.expect(
					200,
					{
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
							{
								count: 1,
								product: {
									id: 2,
									name: 'Hairbrush',
									description: 'Bristly',
									category: 'Health & Beauty',
									pricePennies: 234,
									stockCount: 12,
								},
							},
						],
					},
					done,
				);
		});

		it('returns 400 if items is falsy', done => {
			request(app).put('/cart').send({}).expect(400, done);
		});
	});
});

describe('/cart/checkout', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app).post('/cart/checkout').send({ addressId: 1 }).expect(
				200,
				{
					orderId: 1,
				},
				done,
			);
		});
	});
});
