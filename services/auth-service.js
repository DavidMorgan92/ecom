const db = require('../db/index');
const passwordService = require('./password-service');

/**
 * Get a user from the database including password hash
 * @param {string} email User's email address
 * @returns User database object
 */
async function getUser(email) {
	const query = `
		SELECT first_name, last_name, email, password_hash
		FROM account
		WHERE email = $1;
	`;

	const result = await db.query(query, [email]);

	if (result.rowCount === 0) {
		return null;
	}

	return result.rows[0];
}

/**
 * Serialization method for passport
 * @param {object} user User object
 * @param {function} done Callback
 */
function serializeUser(user, done) {
	done(null, user.email);
}

/**
 * Deserialization method for passport
 * @param {string} email User's email address
 * @param {function} done Callback
 * @returns Result of callback if user is not found
 */
async function deserializeUser(email, done) {
	try {
		const user = await getUser(email);

		if (!user) {
			return done(new Error('User not found'));
		}

		done(null, user);
	} catch (err) {
		done(err);
	}
}

/**
 * Authentication method for passport
 * @param {string} email User's email address
 * @param {string} password User's plain text password
 * @param {function} done Callback
 * @returns Result of callback
 */
async function authenticateUser(email, password, done) {
	try {
		const user = await getUser(email);

		if (!user) {
			return done(null, false, { message: 'No user with the given email' });
		}

		const match = await passwordService.verifyPassword(password, user.passwordHash);

		if (!match) {
			return done(null, false, { message: 'Password does not match' });
		}

		return done(null, user);
	} catch (err) {
		done(err);
	}
}

module.exports = {
	serializeUser,
	deserializeUser,
	authenticateUser,
};
