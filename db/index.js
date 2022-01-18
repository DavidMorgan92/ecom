const { Pool } = require('pg');

const pool = new Pool({
	user: 'postgres',
	password: 'postgres',
	host: 'localhost',
	database: 'ecom',
	port: 5432,
});

module.exports = {
	/**
	 * Execute a query string with given parameters
	 * @param {string} text Query string
	 * @param {array} params Array of parameters
	 * @returns Promise to execute query
	 */
	async query(text, params) {
		return await pool.query(text, params);
	},

	/**
	 * Get a client connection for performing a transaction
	 * @returns Promise to connect to database
	 */
	async getClient() {
		return await pool.connect();
	},
};
