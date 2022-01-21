const accountService = jest.requireActual('../account-service');

async function registerAccount(firstName, lastName, email, password) {
	// Validate input
	// Indicate 400 Bad Request if invalid
	if (!accountService.registerAccountVerifyInput(firstName, lastName, email, password)) {
		throw { status: 400 };
	}
}

module.exports = {
	registerAccount,
};
