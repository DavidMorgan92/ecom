const accountService = jest.requireActual('../account-service');

async function registerAccount(firstName, lastName, email, password) {
	// Validate input
	// Indicate 400 Bad Request if invalid
	if (
		!accountService.registerAccountValidateInput(
			firstName,
			lastName,
			email,
			password,
		)
	) {
		throw { status: 400 };
	}

	return {
		firstName,
		lastName,
		email,
	};
}

async function getAccountInfo(id) {
	return {
		firstName: 'David',
		lastName: 'Morgan',
		email: 'david.morgan@gmail.com',
	};
}

async function updateAccountInfo(id, firstName, lastName) {
	// Validate input
	// Indicate 400 Bad Request if invalid
	if (!accountService.updateAccountInfoValidateInput(firstName, lastName)) {
		throw { status: 400 };
	}

	return {
		firstName,
		lastName,
		email: 'david.morgan@gmail.com',
	};
}

module.exports = {
	registerAccount,
	getAccountInfo,
	updateAccountInfo,
};
