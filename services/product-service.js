function mapDboProductToApiProduct(product) {
	return {
		id: product.id,
		name: product.name,
		description: product.description,
		category: product.category,
		price: product.price,
		stockCount: product.stock_count,
	};
}

module.exports = {
	mapDboProductToApiProduct,
};
