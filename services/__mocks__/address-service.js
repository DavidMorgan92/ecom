async function getAddressById(id) {
	return {
		id: id,
		houseNameNumber: 'Pendennis',
		streetName: 'Tredegar Road',
		townCityName: 'Ebbw Vale',
		postCode: 'NP23 6LP',
	};
}

module.exports = {
	getAddressById,
};
