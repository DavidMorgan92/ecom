const accountService = jest.requireActual('../account-service');

async function registerAccount(firstName, lastName, email, password) {
	// Validate input
	// Indicate 400 Bad Request if invalid
	if (!accountService.registerAccountVerifyInput(firstName, lastName, email, password)) {
		throw { status: 400 };
	}
}

async function getAccountInfo(id) {
	return {
		first_name: 'David',
		last_name: 'Morgan',
		email: 'david.morgan@gmail.com',
	};
}

module.exports = {
	registerAccount,
	getAccountInfo,
};
