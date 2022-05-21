const cartService = jest.requireActual('../cart-service');

async function getCart(requesterId) {
	return {
		items: [
			{
				count: 1,
				product: {
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: 123,
					stockCount: 23,
				},
			},
		],
	};
}

async function updateCart(requesterId, items) {
	if (!cartService.updateCartValidateInput(requesterId, items)) {
		throw { status: 400 };
	}

	return {
		items: [
			{
				count: 1,
				product: {
					id: 1,
					name: 'Toothbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: 123,
					stockCount: 23,
				},
			},
			{
				count: 1,
				product: {
					id: 2,
					name: 'Hairbrush',
					description: 'Bristly',
					category: 'Health & Beauty',
					pricePennies: 234,
					stockCount: 12,
				},
			},
		],
	};
}

async function checkoutCart(requesterId, addressId, paymentIntentId) {
	return 1;
}

module.exports = {
	getCart,
	updateCart,
	checkoutCart,
};
