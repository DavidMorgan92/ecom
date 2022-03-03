const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../server');

// Create a new pool with a connection limit of 1
const mockPool = new Pool({
	database: 'ecom',
	user: 'postgres',
	password: 'postgres',
	port: 5432,
	max: 1, // Reuse the connection to make sure we always hit the same temporal schema
	idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
});

jest.mock('../db/index', () => {
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
	await mockPool.query('CREATE TEMPORARY TABLE account (LIKE account INCLUDING ALL)');
});

afterEach(async () => {
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.address');
	await mockPool.query('DROP TABLE IF EXISTS pg_temp.account');
});

async function createTestUser() {
	const passwordHash = await bcrypt.hash('Password01', 10);
	const values = [1, 'David', 'Morgan', 'david.morgan@gmail.com', passwordHash];
	await mockPool.query('INSERT INTO account (id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)', values);
}

async function loginTestUser() {
	const res = await request(app)
		.post('/auth/login')
		.send({
			email: 'david.morgan@gmail.com',
			password: 'Password01',
		});

	const cookie = res.headers['set-cookie'].find(c => c.startsWith('connect.sid'));

	return cookie;
}

async function insertMockAddress(address) {
	const values = [address.id, address.accountId, address.houseNameNumber, address.streetName, address.townCityName, address.postCode];
	await mockPool.query('INSERT INTO address VALUES ($1, $2, $3, $4, $5, $6)', values);
}

describe('/addresses', () => {
	describe('get', () => {
		it('Allows an authorized user to get all addresses', async () => {
			const addresses = [
				{ id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' },
				{ id: 2, accountId: 1, houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' },
			];

			await insertMockAddress(addresses[0]);
			await insertMockAddress(addresses[1]);

			await createTestUser();
			const cookie = await loginTestUser();

			delete addresses[0].accountId;
			delete addresses[1].accountId;

			await request(app)
				.get('/addresses')
				.set('Cookie', cookie)
				.expect(200, addresses);
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/addresses')
				.expect(401);
		});

		it('Does not get addresses not belonging to the requesting user', async () => {
			const addresses = [
				{ id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' },
				{ id: 2, accountId: 2, houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' },
			];

			await insertMockAddress(addresses[0]);
			await insertMockAddress(addresses[1]);

			await createTestUser();
			const cookie = await loginTestUser();

			delete addresses[0].accountId;
			addresses.pop();

			await request(app)
				.get('/addresses')
				.set('Cookie', cookie)
				.expect(200, addresses);
		});
	});

	describe('post', () => {
		it('Allows an authorized user to create an address', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const address = { houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			const response = await request(app)
				.post('/addresses')
				.set('Cookie', cookie)
				.send(address);

			expect(response.status).toEqual(201);
			expect(response.body).toMatchObject(address);
			expect(response.body).toHaveProperty('id');
			expect(response.body.id).toEqual(expect.any(Number));
		});

		it('Rejects unauthorized users', async () => {
			const address = { houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };
	
			await request(app)
				.post('/addresses')
				.send(address)
				.expect(401);
		});

		it('Rejects address with no house name/number', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const address = { houseNameNumber: '', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };
	
			await request(app)
				.post('/addresses')
				.set('Cookie', cookie)
				.send(address)
				.expect(400);
		});

		it('Rejects address with no street name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const address = { houseNameNumber: 'Pendennis', streetName: '', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };
	
			await request(app)
				.post('/addresses')
				.set('Cookie', cookie)
				.send(address)
				.expect(400);
		});

		it('Rejects address with no town/city name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const address = { houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: '', postCode: 'NP23 6LP' };
	
			await request(app)
				.post('/addresses')
				.set('Cookie', cookie)
				.send(address)
				.expect(400);
		});

		it('Rejects address with no post code', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			const address = { houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: '' };
	
			await request(app)
				.post('/addresses')
				.set('Cookie', cookie)
				.send(address)
				.expect(400);
		});
	});
});

describe('/addresses/:addressId', () => {
	describe('get', () => {
		it('Allows an authorized user to get an address', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			delete address.accountId;

			await request(app)
				.get('/addresses/1')
				.set('Cookie', cookie)
				.expect(200, address);
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/addresses/1')
				.expect(401);
		});

		it('Returns 404 for non-existant addresses', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.get('/addresses/2')
				.set('Cookie', cookie)
				.expect(404);
		});

		it('Does not allow an authorized user to get addresses not belonging to them', async () => {
			const address = { id: 1, accountId: 2, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.get('/addresses/1')
				.set('Cookie', cookie)
				.expect(404);
		});
	});

	describe('put', () => {
		it('Allows an authorized user to update an address', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' };

			const response = await request(app)
				.put('/addresses/1')
				.set('Cookie', cookie)
				.send(newAddress);

			expect(response.status).toEqual(200);
			expect(response.body).toMatchObject(newAddress);
			expect(response.body).toHaveProperty('id');
			expect(response.body.id).toEqual(1);
		});

		it('Rejects unauthorized users', async () => {
			const newAddress = { houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' };

			await request(app)
				.put('/addresses/1')
				.send(newAddress)
				.expect(401);
		});

		it('Returns 404 for non-existant addresses', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' };

			await request(app)
				.put('/addresses/2')
				.set('Cookie', cookie)
				.send(newAddress)
				.expect(404);
		});

		it('Does not allow an authorized user to update addresses not belonging to them', async () => {
			const address = { id: 1, accountId: 2, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' };

			await request(app)
				.put('/addresses/1')
				.set('Cookie', cookie)
				.send(newAddress)
				.expect(404);
		});

		it('Rejects address with no house name/number', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' };
	
			await request(app)
				.put('/addresses/1')
				.set('Cookie', cookie)
				.send(newAddress)
				.expect(400);
		});

		it('Rejects address with no street name', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '3', streetName: '', townCityName: 'Merthyr Tydfil', postCode: 'CF48 3LU' };
	
			await request(app)
				.put('/addresses/1')
				.set('Cookie', cookie)
				.send(newAddress)
				.expect(400);
		});

		it('Rejects address with no town/city name', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: '', postCode: 'CF48 3LU' };
	
			await request(app)
				.put('/addresses/1')
				.set('Cookie', cookie)
				.send(newAddress)
				.expect(400);
		});

		it('Rejects address with no post code', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			const newAddress = { houseNameNumber: '3', streetName: 'St John\'s Court', townCityName: 'Merthyr Tydfil', postCode: '' };
	
			await request(app)
				.put('/addresses/1')
				.set('Cookie', cookie)
				.send(newAddress)
				.expect(400);
		});
	});

	describe('delete', () => {
		it('Allows an authorized user to delete an address', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.delete('/addresses/1')
				.set('Cookie', cookie)
				.expect(204);
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.delete('/addresses/1')
				.expect(401);
		});

		it('Returns 404 for non-existant addresses', async () => {
			const address = { id: 1, accountId: 1, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.delete('/addresses/2')
				.set('Cookie', cookie)
				.expect(404);
		});

		it('Does not allow an authorized user to delete addresses not belonging to them', async () => {
			const address = { id: 1, accountId: 2, houseNameNumber: 'Pendennis', streetName: 'Tredegar Road', townCityName: 'Ebbw Vale', postCode: 'NP23 6LP' };

			await insertMockAddress(address);

			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.delete('/addresses/1')
				.set('Cookie', cookie)
				.expect(404);
		});
	});
});
