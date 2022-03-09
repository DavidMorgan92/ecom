const { Pool } = require('pg');

const devConfig = {
	user: process.env.PG_USER,
	password: process.env.PG_PASSWORD,
	host: process.env.PG_HOST,
	database: process.env.PG_DATABASE,
	port: process.env.PG_PORT,
};

const proConfig = {
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
};

const pool = new Pool(process.env.NODE_ENV === 'production' ? proConfig : devConfig);

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
