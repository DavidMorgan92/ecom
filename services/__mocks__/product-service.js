async function getProductById(id) {
	if (id != 1) {
		return null;
	}

	return {
		id: 1,
		name: 'Toothbrush',
		description: 'Bristly',
		category: 'Health & Beauty',
		pricePennies: '123',
		stockCount: 23,
	};
}

async function getMultipleProductsById(ids) {
}

module.exports = {
	getProductById,
	getMultipleProductsById,
};
