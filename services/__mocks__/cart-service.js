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

module.exports = {
	getAllCarts,
	getCartById,
};
