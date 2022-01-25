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

async function insertMockAddress(address) {
	await mockPool.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', Object.values(address));
}

describe('Address service', () => {
	describe('getAllAddresses', () => {
		it('gets all the addresses', async () => {
			const accountId = 1;
			const addresses = [
				{ id: 1, accountId: accountId, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' },
				{ id: 2, accountId: accountId, houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' },
			];

			await insertMockAddress(addresses[0]);
			await insertMockAddress(addresses[1]);

			const result = await addressService.getAllAddresses(accountId);

			delete addresses[0].accountId;
			delete addresses[1].accountId;

			expect(result).toMatchObject(addresses);
		});

		it('doesn\'t get addresses not belonging to the requesting user', async () => {
			const accountId = 1;
			const addresses = [
				{ id: 1, accountId: accountId, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' },
				{ id: 2, accountId: accountId, houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' },
			];

			await insertMockAddress(addresses[0]);
			await insertMockAddress(addresses[1]);

			const result = await addressService.getAllAddresses(2);

			expect(result).toMatchObject([]);
		});
	});

	describe('getAddressById', () => {
		const address = {
			id: 1,
			accountId: 1,
			houseNameNumber: 'Pendennis',
			streetName: 'Tredegar Road',
			townCityName: 'Ebbw Vale',
			postCode: 'NP23 6LP',
		};

		it('gets address information', async () => {
			await insertMockAddress(address);

			const result = await addressService.getAddressById(address.accountId, address.id);

			expect(result).toMatchObject({
				id: address.id,
				houseNameNumber: address.houseNameNumber,
				streetName: address.streetName,
				townCityName: address.townCityName,
				postCode: address.postCode,
			});
		});

		it('returns null if the requested address does not exist', async () => {
			await insertMockAddress(address);

			const result = await addressService.getAddressById(address.accountId, 2);

			expect(result).toBeNull();
		});

		it('returns null if the requesting user\'s ID doesn\'t match the address owner\'s ID', async () => {
			await insertMockAddress(address);

			const result = await addressService.getAddressById(2, address.id);

			expect(result).toBeNull();
		});
	});

	describe('createAddress', () => {
		it('creates an address', async () => {
			const address = {
				houseNameNumber: 'Pendennis',
				streetName: 'Tredegar Road',
				townCityName: 'Ebbw Vale',
				postCode: 'NP23 6LP',
			};

			const requesterId = 1;

			const result = await addressService.createAddress(requesterId, address.houseNameNumber, address.streetName, address.townCityName, address.postCode);

			expect(result).toMatchObject(address);
			expect(result).toHaveProperty('id');
		});
	});

	describe('updateAddress', () => {
		it('updates an address', async () => {
			await insertMockAddress({
				id: 1,
				accountId: 1,
				houseNameNumber: 'Pendennis',
				streetName: 'Tredegar Road',
				townCityName: 'Ebbw Vale',
				postCode: 'NP23 6LP',
			});

			const address = {
				id: 1,
				houseNameNumber: '3',
				streetName: 'St John\'s Court',
				townCityName: 'Merthyr Tydfil',
				postCode: 'CF48 3LU',
			};

			const requesterId = 1;

			const result = await addressService.updateAddress(requesterId, address.id, address.houseNameNumber, address.streetName, address.townCityName, address.postCode);

			expect(result).toMatchObject(address);
		});
	});
});
