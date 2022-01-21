const bcrypt = require('bcrypt');

/**
 * Get a salted hash of the given plain text password
 * @param {string} password Plain text password
 * @returns Salted and hashed password
 */
async function hashPassword(password) {
	const saltRounds = 10;
	const hash = await bcrypt.hash(password, saltRounds);
	return hash;
}

/**
 * Returns true if the given password and hash are a match
 * @param {string} password Plain text password
 * @param {string} hash Hashed password
 * @returns True if password and hash match
 */
async function verifyPassword(password, hash) {
	const match = await bcrypt.compare(password, hash);
	return match;
}

module.exports = {
	hashPassword,
	verifyPassword,
};
