// TODO: Change mocking so that repeating serialize and authenticate code isn't required. (Use rewire?)

const passport = require('passport');
const passwordService = require('../password-service');

const users = [
	{
		id: 1,
		first_name: 'David',
		last_name: 'Morgan',
		email: 'david.morgan@gmail.com',
		is_admin: false,
	},
	{
		id: 2,
		first_name: 'Admin',
		last_name: 'Admin',
		email: 'admin@gmail.com',
		is_admin: true,
	},
];

async function getUser(email) {
	const user = users.find(u => u.email === email);

	if (!user)
		return null;

	// Give mock users the same password
	user.password_hash = await passwordService.hashPassword('Password01');

	return user;
}

function serializeUser(user, done) {
	done(null, {
		id: user.id,
		email: user.email,
	});
}

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

async function protectedRoute(req, res, next) {
	req.session.passport = {
		user: await getUser('david.morgan@gmail.com'),
	};

	next();
}

async function adminRoute(req, res, next) {
	req.session.passport = {
		user: await getUser('admin@gmail.com'),
	};

	next();
}

module.exports = {
	serializeUser,
	deserializeUser,
	authenticateUser,
	authenticate,
	protectedRoute,
	adminRoute,
};
