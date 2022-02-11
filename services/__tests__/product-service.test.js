const { Pool } = require('pg');
const db = require('../../db');
const productService = require('../product-service');

// Create a new pool with a connection limit of 1
const mockPool = new Pool({
	database: 'ecom',
	user: 'postgres',
	password: 'postgres',
	port: 5432,
	max: 1, // Reuse the connection to make sure we always hit the same temporal schema
	idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
});

jest.mock('../../db/index', () => {
	return {
		async query(text, params) {
			return await mockPool.query(text, params);
		},

		async getClient() {
			return await mockPool.connect();
		},
	};
});

afterAll(async () => {
	await mockPool.end();
});

beforeEach(async () => {
	await mockPool.query('CREATE TEMPORARY TABLE product (LIKE product INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.product');
});

describe('Product service', () => {
	describe('getProductById', () => {
		it('gets product information', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);

			const result = await productService.getProductById(1);

			expect(result).toMatchObject({
				id: 1,
				name: 'Toothbrush',
				description: 'Bristly',
				category: 'Health & Beauty',
				pricePennies: '123',
				stockCount: 23,
			});
		});
	});

	describe('getMultipleProductsById', () => {
		it('gets multiple products', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);

			const result = await productService.getMultipleProductsById([1, 2]);

			expect(result).toMatchObject([
				{
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '123',
					stockCount: 23,
				},
				{
					id: 2,
					name: 'Hairbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '234',
					stockCount: 12,
				},
			]);
		});
	});

	describe('getProductsByCategoryAndName', () => {
		it('returns null if no parameter is given', async () => {
			const result = await productService.getProductsByCategoryAndName();

			expect(result).toBe(null);
		});

		it('gets products by category', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [3, 'Toiletbrush', 'Bristly', 'Bathroom', 321, 21]);

			const result = await productService.getProductsByCategoryAndName('Health & Beauty', null);

			expect(result).toMatchObject([
				{
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '123',
					stockCount: 23,
				},
				{
					id: 2,
					name: 'Hairbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '234',
					stockCount: 12,
				},
			]);
		});

		it('gets products by partial category', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [3, 'Toiletbrush', 'Bristly', 'Bathroom', 321, 21]);

			const result = await productService.getProductsByCategoryAndName('Beauty', null);

			expect(result).toMatchObject([
				{
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '123',
					stockCount: 23,
				},
				{
					id: 2,
					name: 'Hairbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '234',
					stockCount: 12,
				},
			]);
		});

		it('gets products by name', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [3, 'Toiletbrush', 'Bristly', 'Bathroom', 321, 21]);

			const result = await productService.getProductsByCategoryAndName(null, 'Toiletbrush');

			expect(result).toMatchObject([
				{
					id: 3,
					name: 'Toiletbrush',
					description: 'Bristly',
					category: 'Bathroom',
					pricePennies: '321',
					stockCount: 21,
				},
			]);
		});
	
		it('gets products by partial name', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [3, 'Toiletbrush', 'Bristly', 'Bathroom', 321, 21]);
	
			const result = await productService.getProductsByCategoryAndName(null, 'brush');
	
			expect(result).toMatchObject([
				{
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '123',
					stockCount: 23,
				},
				{
					id: 2,
					name: 'Hairbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: '234',
					stockCount: 12,
				},
				{
					id: 3,
					name: 'Toiletbrush',
					description: 'Bristly',
					category: 'Bathroom',
					pricePennies: '321',
					stockCount: 21,
				},
			]);
		});

		it('get products by category and name', async () => {
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [1, 'Toothbrush', 'Bristly', 'Health & Beauty', 123, 23]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [2, 'Hairbrush', 'Bristly', 'Health & Beauty', 234, 12]);
			await db.query('INSERT INTO product VALUES ($1, $2, $3, $4, $5, $6)', [3, 'Toiletbrush', 'Bristly', 'Bathroom', 321, 21]);
	
			const result = await productService.getProductsByCategoryAndName('Bathroom', 'brush');
	
			expect(result).toMatchObject([
				{
					id: 3,
					name: 'Toiletbrush',
					description: 'Bristly',
					category: 'Bathroom',
					pricePennies: '321',
					stockCount: 21,
				},
			]);
		});
	});
});
