const { Pool } = require('pg');
const addressService = require('../address-service');

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
	await mockPool.query('CREATE TEMPORARY TABLE address (LIKE address INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.address');
});

describe('Address service', () => {
	describe('getAddressById', () => {
		it('gets address information', async () => {
			const id = 1;
			const accountId = 1;
			const houseNameNumber = 'Pendennis';
			const streetName = 'Tredegar Road';
			const townCityName = 'Ebbw Vale';
			const postCode = 'NP23 6LP';
			const values = [id, accountId, houseNameNumber, streetName, townCityName, postCode];
			await mockPool.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', values);

			const result = await addressService.getAddressById(id);

			expect(result).toMatchObject({
				id,
				houseNameNumber,
				streetName,
				townCityName,
				postCode,
			});
		});
	});
});
