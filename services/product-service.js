function mapDboProductToApiProduct(product) {
	return {
		id: product.id,
		name: product.name,
		description: product.description,
		category: product.category,
		pricePennies: product.price_pennies,
		stockCount: product.stock_count,
	};
}

module.exports = {
	mapDboProductToApiProduct,
};
