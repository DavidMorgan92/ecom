async function getAddressById(requesterId, id) {
	if (id != 1) {
		return null;
	}

	return {
		id: 1,
		houseNameNumber: 'Pendennis',
		streetName: 'Tredegar Road',
		townCityName: 'Ebbw Vale',
		postCode: 'NP23 6LP',
	};
}

module.exports = {
	getAddressById,
};
