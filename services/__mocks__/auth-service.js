// TODO: Change mocking so that repeating code isn't required. (Use rewire?)

const passport = require('passport');
const passwordService = require('../password-service');

async function getUser(email) {
	if (email !== 'david.morgan@gmail.com')
		return null;

	return {
		first_name: 'David',
		last_name: 'Morgan',
		email: 'david.morgan@gmail.com',
		password_hash: await passwordService.hashPassword('Password01'),
	};
}

function serializeUser(user, done) {
	done(null, user.email);
}

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

function protectedRoute(req, res, next) {
	next();
}

module.exports = {
	serializeUser,
	deserializeUser,
	authenticateUser,
	authenticate,
	protectedRoute,
};
