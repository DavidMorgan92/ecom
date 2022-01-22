const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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

afterAll(async () => {
	await mockPool.end();
});

beforeEach(async () => {
	await mockPool.query('CREATE TEMPORARY TABLE account (LIKE account INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.account');
});

describe('Account service', () => {
	const id = 1;
	const firstName = 'David';
	const lastName = 'Morgan';
	const email = 'david.morgan@gmail.com';
	const password = 'Password01';

	describe('registerAccount', () => {
		it('creates an account', async () => {
			const result = await accountService.registerAccount(firstName, lastName, email, password);

			expect(result).toMatchObject({
				first_name: firstName,
				last_name: lastName,
				email: email,
			});
		});
	});

	describe('getAccountInfo', () => {
		it('gets account information', async () => {
			const passwordHash = await bcrypt.hash(password, 10);
			const values = [id, firstName, lastName, email, passwordHash];
			await mockPool.query('INSERT INTO account (id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)', values);

			const result = await accountService.getAccountInfo(id);

			expect(result).toMatchObject({
				first_name: firstName,
				last_name: lastName,
				email: email,
			});
		});
	});
});
