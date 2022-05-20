const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Check if the given inputs for the beginTransaction function are valid
 * @param {number} pricePennies Total price of the order
 * @param {string} requesterEmail Email address of the requesting user
 * @returns True if all inputs are valid
 */
function beginTransactionValidateInput(pricePennies, requesterEmail) {
	if (isNaN(pricePennies)) {
		return false;
	}

	if (pricePennies < 0) {
		return false;
	}

	if (!requesterEmail) {
		return false;
	}

	return true;
}

/**
 * Begin a transaction on the server which will be completed on the client using the returned client secret
 * @param {number} pricePennies Total price of the order
 * @param {string} requesterEmail Email address of the requesting user
 * @returns Client secret used to complete the transaction
 */
async function beginTransaction(pricePennies, requesterEmail) {
	if (!beginTransactionValidateInput(pricePennies, requesterEmail)) {
		throw { status: 400 };
	}

	// Create a payment intent with the given price and user's email address
	const paymentIntent = await stripe.paymentIntents.create({
		currency: 'gbp',
		amount: pricePennies,
		receipt_email: requesterEmail,
	});

	// Return the client secret
	return paymentIntent.client_secret;
}

module.exports = {
	beginTransaction,
};
