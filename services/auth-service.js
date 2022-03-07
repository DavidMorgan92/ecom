const passport = require('passport');
const db = require('../db');
const passwordService = require('./password-service');

/**
 * Get a user from the database including password hash
 * @param {string} email User's email address
 * @returns User database object
 */
async function getUser(email) {
	const query = `
		SELECT id, first_name, last_name, email, password_hash
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
	done(null, {
		id: user.id,
		email: user.email,
	});
}

/**
 * Deserialization method for passport
 * @param {string} email User's email address
 * @param {function} done Callback
 * @returns Result of callback if user is not found
 */
 async function deserializeUser(userInfo, done) {
	try {
		const user = await getUser(userInfo.email);

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

		const match = await passwordService.verifyPassword(password, user.password_hash);

		if (!match) {
			return done(null, false, { message: 'Password does not match' });
		}

		return done(null, user);
	} catch (err) {
		done(err);
	}
}

/**
 * Express middleware to authenticate and login a user
 */
function authenticate(req, res, next) {
	return passport.authenticate('local', (err, user, info) => {
		if (err) {
			return res.sendStatus(500);
		}

		if (!user) {
			return res.status(401).json({ error: info.message });
		}

		req.logIn(user, err => {
			if (err) {
				return next(err);
			}

			return res.sendStatus(200);
		});
	})(req, res, next);
}

/**
 * Express middleware to require authentication of a route
 */
function protectedRoute(req, res, next) {
	if (req.isUnauthenticated()) {
		return res.sendStatus(401);
	}

	next();
}

module.exports = {
	serializeUser,
	deserializeUser,
	authenticateUser,
	authenticate,
	protectedRoute,
};
