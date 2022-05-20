const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Check if the given inputs for the beginTransaction function are valid
 * @param {number} pricePennies Total price of the order
 * @returns True if all inputs are valid
 */
function beginTransactionValidateInput(pricePennies) {
	if (isNaN(pricePennies)) {
		return false;
	}

	if (pricePennies < 0) {
		return false;
	}

	return true;
}

/**
 * Begin a transaction on the server which will be completed on the client using the returned client secret
 * @param {number} pricePennies Total price of the order
 * @returns Client secret used to complete the transaction
 */
async function beginTransaction(pricePennies) {
	if (!beginTransactionValidateInput(pricePennies)) {
		throw { status: 400 };
	}

	// Create a payment intent with the given price
	const paymentIntent = await stripe.paymentIntents.create({
		currency: 'gbp',
		amount: pricePennies,
	});

	// Return the client secret
	return paymentIntent.client_secret;
}

module.exports = {
	beginTransaction,
};
