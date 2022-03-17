const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../server');
const db = require('../db');

// Create a new pool with a connection limit of 1
const mockPool = new Pool({
	database: 'ecom',
	user: 'postgres',
	password: 'postgres',
	port: 5432,
	max: 1, // Reuse the connection to make sure we always hit the same temporal schema
	idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
});

jest.mock('../db', () => {
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
	await db.query('CREATE TEMPORARY TABLE account (LIKE account INCLUDING ALL)');
});

afterEach(async () => {
	await db.query('DROP TABLE IF EXISTS pg_temp.account');
});

async function createTestUser() {
	const passwordHash = await bcrypt.hash('Password01', 10);
	const values = [1, 'David', 'Morgan', 'david.morgan@gmail.com', passwordHash];
	await db.query(
		'INSERT INTO account (id, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
		values,
	);
}

describe('/auth/login', () => {
	describe('post', () => {
		it('Allows user to log in', async () => {
			await createTestUser();

			await request(app)
				.post('/auth/login')
				.send({
					email: 'david.morgan@gmail.com',
					password: 'Password01',
				})
				.expect(200);
		});

		it('Rejects login with incorrect email', async () => {
			await createTestUser();

			await request(app)
				.post('/auth/login')
				.send({
					email: 'david.morgan@mail.com',
					password: 'Password01',
				})
				.expect(401);
		});

		it('Rejects login with incorrect password', async () => {
			await createTestUser();

			await request(app)
				.post('/auth/login')
				.send({
					email: 'david.morgan@gmail.com',
					password: 'Password1',
				})
				.expect(401);
		});
	});
});

describe('/auth/register', () => {
	describe('post', () => {
		it('Allows a user to register a new account', async () => {
			await request(app)
				.post('/auth/register')
				.send({
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgan@gmail.com',
					password: 'Password01',
				})
				.expect(200, {
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgan@gmail.com',
				});
		});

		it('Does not allow a user to register a new account with an existing email address', async () => {
			await createTestUser();

			await request(app)
				.post('/auth/register')
				.send({
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgan@gmail.com',
					password: 'Password01',
				})
				.expect(500);
		});

		it('Does not allow a user to register a new account with an invalid email address', async () => {
			await request(app)
				.post('/auth/register')
				.send({
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgangmail.com',
					password: 'Password01',
				})
				.expect(400);
		});

		it('Does not allow a user to register a new account without an email address', async () => {
			await request(app)
				.post('/auth/register')
				.send({
					firstName: 'David',
					lastName: 'Morgan',
					email: '',
					password: 'Password01',
				})
				.expect(400);
		});

		it('Does not allow a user to register a new account without a password', async () => {
			await request(app)
				.post('/auth/register')
				.send({
					firstName: 'David',
					lastName: 'Morgan',
					email: 'david.morgangmail.com',
					password: '',
				})
				.expect(400);
		});
	});
});
