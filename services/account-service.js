const db = require('../db/index');
const passwordService = require('./password-service');

/**
 * Check if the given email address is valid
 * @param {string} email Email address to validate
 * @returns True if the email address is valid
 */
function emailIsValid(email) {
	const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return EMAIL_REGEX.test(email)
}

/**
 * Check if the given inputs for the registerAccount function are valid
 * @param {string} firstName User's first name
 * @param {string} lastName User's last name
 * @param {string} email User's unique email address
 * @param {string} password User's plain text password
 * @returns True if all inputs are valid
 */
function registerAccountVerifyInput(firstName, lastName, email, password) {
	if (!firstName || !lastName || !email || !password || !emailIsValid(email)) {
		return false;
	}

	return true;
}

/**
 * Creates a new account record in the database
 * @param {string} firstName User's first name
 * @param {string} lastName User's last name
 * @param {string} email User's unique email address
 * @param {string} password User's plain text password
 */
async function registerAccount(firstName, lastName, email, password) {
	// Verify input
	if (!registerAccountVerifyInput(firstName, lastName, email, password)) {
		throw { status: 400 };
	}

	// Insert values into database
	const passwordHash = passwordService.hashPassword(password);
	const values = [firstName, lastName, email, passwordHash];
	await db.query('INSERT INTO account (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4)', values);
}

module.exports = {
	registerAccountVerifyInput,
	registerAccount,
};
