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
	await mockPool.query('CREATE TEMPORARY TABLE account (LIKE account INCLUDING ALL)');
});

afterEach(async () => {
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

describe('/account', () => {
	describe('get', () => {
		it('Allows an authorized user to get their account information', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.get('/account')
				.set('Cookie', cookie)
				.expect(200, {
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgan@gmail.com',
				});
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.get('/account')
				.expect(401);
		});
	});

	describe('put', () => {
		it('Allows an authorized user to update their account information', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.put('/account')
				.set('Cookie', cookie)
				.send({
					firstName: 'Dave',
					lastName: 'Mogsy',
				})
				.expect(200, {
					firstName: 'Dave',
					lastName: 'Mogsy',
					email: 'david.morgan@gmail.com',
				});
		});

		it('Rejects unauthorized users', async () => {
			await request(app)
				.put('/account')
				.expect(401);
		});

		it('Rejects empty first name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.put('/account')
				.set('Cookie', cookie)
				.send({
					firstName: '',
					lastName: 'Mogsy',
				})
				.expect(400);
		});

		it('Rejects empty last name', async () => {
			await createTestUser();
			const cookie = await loginTestUser();

			await request(app)
				.put('/account')
				.set('Cookie', cookie)
				.send({
					firstName: 'Dave',
					lastName: '',
				})
				.expect(400);
		});
	});
});
