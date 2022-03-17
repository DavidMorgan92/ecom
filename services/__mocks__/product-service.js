const productService = jest.requireActual('../product-service');

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

let idGen = 4;

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
	let prods = null;

	if (category && name) {
		prods = products.filter(
			p => p.category.includes(category) && p.name.includes(name),
		);
	} else if (category) {
		prods = products.filter(p => p.category.includes(category));
	} else if (name) {
		prods = products.filter(p => p.name.includes(name));
	}

	return prods;
}

async function getAllProducts() {
	return products;
}

async function createProduct(
	name,
	description,
	category,
	pricePennies,
	stockCount,
) {
	if (
		!productService.createProductValidateInput(
			name,
			description,
			category,
			pricePennies,
			stockCount,
		)
	) {
		throw { status: 400 };
	}

	const newProduct = {
		id: idGen++,
		name,
		description,
		category,
		pricePennies,
		stockCount,
	};

	products.push(newProduct);

	return newProduct;
}

module.exports = {
	getProductById,
	getMultipleProductsById,
	getProductsByCategoryAndName,
	getAllProducts,
	createProduct,
};
