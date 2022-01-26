async function getAllOrders(requesterId) {
	return [{
		id: 1,
		createdAt: '2004-10-19T09:23:54.000Z',
		address: {
			id: 1,
			houseNameNumber: 'Pendennis',
			streetName: 'Tredegar Road',
			townCityName: 'Ebbw Vale',
			postCode: 'NP23 6LP',
		},
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

module.exports = {
	getAllOrders,
};
