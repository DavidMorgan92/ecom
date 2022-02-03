const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/cart-service');

describe('/carts', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/carts')
				.expect(200, [{
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'My Cart',
					ordered: false,
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
				}], done);
		});
	});

	describe('post', () => {
		it('returns status 201', done => {
			request(app)
				.post('/carts')
				.send({
					name: 'My Cart',
					items: [
						{
							productId: 1,
							count: 1,
						},
						{
							productId: 2,
							count: 2,
						},
					],
				})
				.expect(201, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'My Cart',
					ordered: false,
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
							count: 2,
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
				}, done);
		});

		it('returns status 400 with no input', done => {
			request(app)
				.post('/carts')
				.expect(400, done);
		});
	});
});

describe('/carts/:cartId', () => {
	describe('get', () => {
		it('returns status 200', done => {
			request(app)
				.get('/carts/1')
				.expect(200, {
					id: 1,
					createdAt: '2004-10-19T09:23:54.000Z',
					name: 'My Cart',
					ordered: false,
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
				}, done);
		});

		it('returns status 404 if the cart doesn\'t exist', done => {
			request(app)
				.get('/carts/2')
				.expect(404, done);
		});
	});

	describe('put', () => {
		it('returns status 200', done => {
			request(app)
				.put('/carts/1')
				.expect(200, done);
		});
	});

	describe('delete', () => {
		it('returns status 204', done => {
			request(app)
				.delete('/carts/1')
				.expect(204, done);
		});

		it('returns status 404 if the cart doesn\'t exist', done => {
			request(app)
				.put('/carts/2')
				.expect(404, done);
		});
	});
});

describe('/carts/:cartId/checkout', () => {
	describe('post', () => {
		it('returns status 200', done => {
			request(app)
				.post('/carts/1/checkout')
				.send({ addressId: 1 })
				.expect(200, {
					orderId: 1,
				}, done);
		});
	});
});
