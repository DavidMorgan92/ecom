const { Pool } = require('pg');
const accountService = require('../account-service');

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

afterAll(() => {
	mockPool.end();
});

beforeEach(async () => {
	await mockPool.query('CREATE TEMPORARY TABLE account (LIKE account INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.account');
});

describe('Account service', () => {
	describe('registerAccount', () => {
		it('creates an account', async () => {
			const firstName = 'David';
			const lastName = 'Morgan';
			const email = 'david.morgan@gmail.com';
			const password = 'Password01';

			const result = await accountService.registerAccount(firstName, lastName, email, password);

			expect(result).toHaveProperty('id');
			expect(result).toMatchObject({
				first_name: firstName,
				last_name: lastName,
				email: email,
			});
		});
	});
});
