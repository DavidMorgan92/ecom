const cartService = jest.requireActual('../cart-service');

async function getAllCarts(requesterId) {
	return [{
		id: 1,
		createdAt: '2004-10-19T09:23:54.000Z',
		name: 'My Cart',
		ordered: false,
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
	}];
}

async function getCartById(requesterId, cartId) {
	if (cartId != 1) {
		return null;
	}

	return {
		id: 1,
		createdAt: '2004-10-19T09:23:54.000Z',
		name: 'My Cart',
		ordered: false,
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

async function createCart(requesterId, name, items) {
	if (!cartService.createCartValidateInput(requesterId, name, items)) {
		throw { status: 400 };
	}

	return {
		id: 1,
		createdAt: '2004-10-19T09:23:54.000Z',
		name: 'My Cart',
		ordered: false,
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
				count: 2,
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

async function updateCart(requesterId, cartId, name, items) {
	if (!cartService.updateCartValidateInput(requesterId, cartId, name, items)) {
		throw { status: 400 };
	}

	return {
		id: 1,
		createdAt: '2004-10-19T09:23:54.000Z',
		name: name,
		ordered: false,
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

async function deleteCart(requesterId, cartId) {
	if (cartId != 1) {
		return false;
	}

	return true;
}

async function checkoutCart(requesterId, cartId, addressId) {
	return 1;
}

module.exports = {
	getAllCarts,
	getCartById,
	createCart,
	updateCart,
	deleteCart,
	checkoutCart,
};
