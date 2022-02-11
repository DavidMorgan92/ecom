const products = [
	{
		id: 1,
		name: 'Toothbrush',
		description: 'Bristly',
		category: 'Health & Beauty',
		pricePennies: '123',
		stockCount: 23,
	},
	{
		id: 2,
		name: 'Hairbrush',
		description: 'Bristly',
		category: 'Health & Beauty',
		pricePennies: '234',
		stockCount: 12,
	},
	{
		id: 3,
		name: 'Toiletbrush',
		description: 'Bristly',
		category: 'Bathroom',
		pricePennies: '321',
		stockCount: 21,
	},
];

async function getProductById(id) {
	if (!products.some(p => p.id == id)) {
		return null;
	}

	return products.find(p => p.id == id);
}

async function getMultipleProductsById(ids) {
	return products.filter(p => ids.some(i => i == p.id));
}

async function getProductsByCategoryAndName(category, name) {

}

module.exports = {
	getProductById,
	getMultipleProductsById,
	getProductsByCategoryAndName,
};
